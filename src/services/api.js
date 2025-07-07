import axios from 'axios';

const baseURL = `${
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : process.env.PUBLIC_URL || process.env.APP_URL
}/api/v1/`;

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
