<script>
	import Home from './components/Home.svelte'
	import Room from './components/Room.svelte'
	// import Footer from './components/Footer.svelte'
	import { Route } from "tinro";
</script>

<main>
	<Route path="/*">
		<Route path="/"><Home /></Route>
		<Route path="/:room" let:meta><Room room={meta.params.room}/></Route>
	</Route>
	<!-- <Footer /> -->
</main>