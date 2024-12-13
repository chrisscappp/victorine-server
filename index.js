const port = 1111
const io = require("socket.io")(port, {
	cors: {
		origin: "*"
	}
})

let gameRooms = []

io.on('connection', (socket) => {
	console.log('The new user has joined from socket_id: ' + socket.id)

	socket.on('on_create_game_room', (data) => {
		const newGameRoom = {
			id: data.roomId,
			isStartGame: false,
			players: [data.user],
			playersStats: []
		}
		gameRooms.push(newGameRoom)
	})
	socket.on('join_to_game', (data) => {
		const { user, roomId } = data
		const findedRoom = gameRooms.find(room => room.id === roomId)
		if (findedRoom) {
			const findedPlayer = findedRoom.players.find(player => player.name === user.name)
			if (!findedPlayer) {
				findedRoom.players.push(user)
				socket.broadcast.emit("receive_join_to_game", findedRoom.players)
			}
		}
		console.log(gameRooms)
	})
	socket.on('disconnect_on_game', (data) => {
		const { user, roomId } = data
		const findedRoom = gameRooms.find(room => room.id === roomId)
		if (findedRoom) {
			const filteredPlayers = findedRoom.players.filter(player => player.name !== user.name)
			findedRoom.players = filteredPlayers
			socket.broadcast.emit("receive_disconnect_on_game", findedRoom.players)
			// if (findedRoom.players.length === 0) {
			// 	const newGameRooms = gameRooms.filter(room => room.id !== roomId)
			// 	gameRooms = newGameRooms
			// }
		}
	})
	socket.on('update_player_game_status', (data) => {
		const { user, roomId } = data
		const findedRoom = gameRooms.find(room => room.id === roomId)
		if (findedRoom) {
			const findedUser = findedRoom.players.find(player => player.name === user.name)
			if (findedUser) {
				const playerIndex = findedRoom.players.indexOf(findedUser)
				if (playerIndex !== -1) {
					findedRoom.players[playerIndex] = user
					socket.broadcast.emit("receive_update_player_game_status", findedRoom.players)
				}
			}
		}
	})
	socket.on('start_game', (data) => {
		const { players, roomId, isStartGame } = data
		const gameRoom = gameRooms.find(room => room.id === roomId)
		if (gameRoom) {
			const playersWithoutLeader = players.filter(user => user.role !== "leader")
			gameRoom.playersStats = playersWithoutLeader
			gameRoom.isStartGame = isStartGame
			const gameRoomIndex = gameRooms.findIndex(room => room.id === roomId)
			if (gameRoomIndex !== -1) {
				gameRooms[gameRoomIndex] = gameRoom
				socket.broadcast.emit('recieve_start_game', players)
			}
		}
	})
	socket.on('player_answer_the_question', (data) => {
		socket.broadcast.emit('receive_player_answer_the_question', data)
	})
	socket.on('right_answer', (data) => {
		const { player, roomId, scores } = data
		const gameRoom = gameRooms.find(room => roomId === room.id)
		if (gameRoom) {
			const findedPlayerIndex = gameRoom.playersStats.findIndex(p => p.name === player.name)
			if (findedPlayerIndex !== -1) {
				gameRoom.playersStats[findedPlayerIndex].scores += scores
				socket.broadcast.emit('receive_right_answer', {
					roomId,
					player: gameRoom.playersStats[findedPlayerIndex]
				})
			}
		}
	})
	socket.on('unright_answer', (data) => {
		socket.broadcast.emit('receive_unright_answer', data)
	})
	socket.on('game_over', (data) => {
		const gameRoom = gameRooms.find(room => room.id === data)
		if (gameRoom) {
			socket.broadcast.emit("receive_game_over", gameRoom.playersStats)
			gameRoom.players = []
			gameRoom.playersStats = []
		}
	})
})