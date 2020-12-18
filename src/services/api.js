import axios from 'axios';

const baseURL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080/api/v1/'
        : 'https://www.lets-talk.dev.br/api/v1/';

const api = axios.create({
    baseURL,
});

api.interceptors.request.use(config => {
    return config;
});

api.interceptors.response.use(
    response => {
        return response;
    },
    function(error) {
        return Promise.reject(error);
    },
);

export default api;
