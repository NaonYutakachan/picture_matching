package main

import (
	"fmt"
	"net/http"
	"text/template"
)

func processGame(writer http.ResponseWriter, request *http.Request) {
	t := template.Must(template.ParseFiles("game/display.html"))
	t.ExecuteTemplate(writer, "display", "(可変メッセージ)")
}

func main() {
	// マルチプレクサを用意する．
	mux := http.NewServeMux()

	// 表示するファイルを取得する．
	files := http.FileServer(http.Dir("game"))
	mux.Handle("/game/", http.StripPrefix("/game/", files))

	// ハンドラを登録する．
	mux.HandleFunc("/game", processGame)

	// サーバーを起動する．
	server := &http.Server{
		Addr:    "127.0.0.1:8080",
		Handler: mux,
	}
	fmt.Print("Running server...")
	server.ListenAndServe()
}
