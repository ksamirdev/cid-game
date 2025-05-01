import { MyDurableObject } from './MyDurableObject';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const room = url.searchParams.get('room') || 'default-room';

		const id = env.MY_DURABLE_OBJECT.idFromName(room);
		const stub = env.MY_DURABLE_OBJECT.get(id);

		return stub.fetch(request);
	},
} satisfies ExportedHandler<Env>;

export { MyDurableObject };
