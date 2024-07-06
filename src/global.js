let io;

const setSocketIo = (socketIo) => {
    io = socketIo;
};

const getSocketIo = () => {
    return io;
};

module.exports = {
    setSocketIo,
    getSocketIo,
};
