<template>
  <div id="app">
    <amplify-authenticator>
      <div class="welcome" v-if="authState === 'signedin' && user">
        <div>Hello, {{user.username}}</div>
        <amplify-sign-out></amplify-sign-out>
      </div>
      <div class="form-body">
        <form v-on:submit.prevent autocomplete="off">
          <div>
            <label>Name: </label>
            <input v-model='form.name' class='input' autocomplete="off"/>
          </div>
          <div>
            <label>Description: </label>
            <input v-model='form.description' class='input' autocomplete="off"/>
          </div>
          <div>
            <label>City: </label>
            <input v-model='form.city' class='input' autocomplete="off"/>
          </div>
          <button @click="createRestaurant" class="button">Create</button>
          <button @click="getData" class="button">Refresh</button>
        </form>
      </div>
      <div class="app-body">
        <div v-if="loading" class="loading">Loading...</div>
        <div class="card-container" v-if="!loading">
          <div class="card" v-for="restaurant of sortedRestaurants" :key="restaurant.id">
            <div class="remove"><button @click="deleteRestaurant(restaurant)" class="button">Delete</button></div>
            <div class="name">{{ restaurant.city }}</div>
            <div class="price">{{ restaurant.name }}</div>
            <div class="symbol">{{ restaurant.description }}</div>
          </div>
        </div>
      </div>
    </amplify-authenticator>
  </div>
</template>

<script>
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { API, graphqlOperation } from 'aws-amplify';
import { listRestaurants } from './graphql/queries';
import { createRestaurant, deleteRestaurant } from './graphql/mutations';
import { onCreateRestaurant, onDeleteRestaurant } from './graphql/subscriptions';

export default {
  name: 'App',
  data() {
    return {
      authState: {},
      unsubscribeAuth: {},
      user: {},
      restaurants: [],
      form: {},
      loading: true
    };
  },
  computed: {
    sortedRestaurants() {
      let restaurants = [...this.restaurants];
      return restaurants.sort((a, b) => a.name.localeCompare(b.name));
    }
  },
  created() {
    this.unsubscribeAuth = onAuthUIStateChange((authState, authData) => {
      this.authState = authState;
      if (authState === AuthState.SignedIn) {
        this.user = authData;
        this.getData();
        console.log('Auth State:', authState);
        console.log('Auth Data:', authData);
        console.log(this.getData());
      }
    });

    //Subscribe to changes
    API.graphql(graphqlOperation(onCreateRestaurant))
    .subscribe((sourceData) => {
      const newRestaurant = sourceData.value.data.onCreateRestaurant;
      if (newRestaurant) {
        // skip our own mutations and duplicates
        if(this.restaurants.some(r => r.id == newRestaurant.id)) return;
        this.restaurants = [newRestaurant, ...this.restaurant];
      }
    });

    API.graphql(graphqlOperation(onDeleteRestaurant))
    .subscribe((sourceData) => {
      const deletedRestaurant = sourceData.value.data.onDeleteRestaurant;
      if (deletedRestaurant) {
        this.restaurants = this.restaurants.filter(r => r.id != deletedRestaurant.id)
      }
    });
  },
  methods: {
    async getData() {
      try {
        this.loading = true;
        const response = await API.graphql(graphqlOperation(listRestaurants));
        console.log(response);
        this.restaurants = response.data.listRestaurants.items;
        console.log(this.restaurants);

      }
      catch (error) {
        console.log('Error loading restaurants...', error);
      }
      finally {
        this.loading = false;
      }
    },
    async createRestaurant() {
      const { name, description, city } = this.form;
      if(!name || !description || !city) return;

      const restaurant = { name, description, city, clientId: this.clientId };
      try {
        const response = await API.graphql(graphqlOperation(createRestaurant, { input: restaurant }));
        console.log('Restaurant item created!')
        this.restaurants = [...this.restaurants, response.data.createRestaurant];
        this.form = { name: '', description: '', city: '' };
      }
      catch (error) {
        console.log('Error creating restaurant...', error);
      }
    },
    async deleteRestaurant(restaurant) {
      if(restaurant) {
        try {
          const { id } = restaurant;
          await API.graphql(graphqlOperation(deleteRestaurant, { input: { id: id }}))
          console.log('Restaurant item deleted!');
          this.restaurants = this.restaurants.filter(r => r.id != restaurant.id);
        }
        catch(error) {
          console.log('Error deleting restaurant...', error);
        }
      }
    },
  },
  beforeDestroy() {
    this.unsubscribeAuth();
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
