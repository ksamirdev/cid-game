import { DurableObject } from 'cloudflare:workers';

interface Player {
	id: string;
	name: string;
	socket: WebSocket;
}

export class MyDurableObject extends DurableObject<Env> {
	players: Map<string, Player> = new Map();
	adminId: string | null = null;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/connect') {
			const [clientSocket, serverSocket] = Object.values(new WebSocketPair());
			const clientId = crypto.randomUUID();

			serverSocket.accept();

			serverSocket.addEventListener('message', async (event) => {
				try {
					const msg = JSON.parse(event.data.toString());

					if (msg.type === 'join') {
						const name = msg.name || 'Player';

						if (!this.adminId) this.adminId = clientId;

						this.players.set(clientId, {
							id: clientId,
							name,
							socket: serverSocket,
						});

						this.broadcast({
							type: 'player-joined',
							id: clientId,
							name,
							isAdmin: clientId === this.adminId,
							count: this.players.size,
						});
					}

					if (msg.type === 'start') {
						if (clientId !== this.adminId) {
							serverSocket.send(
								JSON.stringify({
									type: 'error',
									message: 'Only admin can start the game',
								})
							);
							return;
						}

						const playerArray = Array.from(this.players.values());
						if (playerArray.length < 3) {
							serverSocket.send(
								JSON.stringify({
									type: 'error',
									message: 'Need at least 3 players to start the game',
								})
							);
							return;
						}

						// Shuffle players
						const shuffled = getShuffledArr<Player>(playerArray);

						const cid = shuffled[0];
						const killer = shuffled[1];
						const others = shuffled.slice(2);
						0;

						// small delay while delivering the role
						this.broadcast({
							type: 'roles-assigning',
						});
						await new Promise((res) => setTimeout(res, 2 * 1000));

						// Assign roles and notify each player
						cid.socket.send(JSON.stringify({ type: 'role', role: 'CID' }));
						killer.socket.send(JSON.stringify({ type: 'role', role: 'Killer' }));

						for (const p of others) {
							p.socket.send(JSON.stringify({ type: 'role', role: 'Player' }));
						}

						this.broadcast({
							type: 'game-started',
							count: playerArray.length,
						});
					}
				} catch (err) {
					serverSocket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
				}
			});

			serverSocket.addEventListener('close', () => {
				const player = this.players.get(clientId);
				if (player) {
					this.players.delete(clientId);
					this.broadcast({
						type: 'player-left',
						id: clientId,
						name: player.name,
						count: this.players.size,
					});

					if (clientId === this.adminId) {
						const next = this.players.values().next().value;
						if (next) {
							this.adminId = next.id;
							next.socket.send(JSON.stringify({ type: 'you-are-now-admin' }));
						} else {
							this.adminId = null;
						}
					}
				}
			});

			return new Response(null, {
				status: 101,
				webSocket: clientSocket,
			});
		}

		return new Response('Not found', { status: 404 });
	}

	broadcast(message: any) {
		const json = JSON.stringify(message);
		for (const player of this.players.values()) {
			player.socket.send(json);
		}
	}
}

function getShuffledArr<T extends any>(arr: T[]) {
	const newArr = arr.slice();
	for (let i = newArr.length - 1; i > 0; i--) {
		const rand = Math.floor(Math.random() * (i + 1));
		[newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
	}
	return newArr;
}
