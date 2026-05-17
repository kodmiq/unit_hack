package handlers

import "dodirtim-backend/ws"

var hub *ws.Hub

func SetHub(h *ws.Hub) {
	hub = h
}
