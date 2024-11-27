import axios from 'axios';

const api = axios.create({
  baseURL: 'http://distribuidoraarcox.com/api/',
});

export default api;