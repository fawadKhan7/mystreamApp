const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Something went wrong!' });
    }
};

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

module.exports = { errorHandler, ApiError };
