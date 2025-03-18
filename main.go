package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"text/template"
)

type Configuration struct {
	Address string
}

// config.json からプログラム実行時の設定を読み出し，構造体に格納して戻り値として返す．
//
// 成功時は構造体を返し，失敗時は nil とエラーを返す．
func loadConfig() (*Configuration, error) {
	// 設定ファイルを読み出す．
	file, err := os.Open("config.json")
	if err != nil {
		return nil, err
	}

	// 読み出した設定データを，構造体に格納する．
	config := Configuration{}
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func processGame(writer http.ResponseWriter, request *http.Request) {
	t := template.Must(template.ParseFiles("game/display.html"))
	t.ExecuteTemplate(writer, "display", "user 様")
}

func main() {
	// 設定を読み出す．
	config, err := loadConfig()
	if err != nil {
		log.Fatalln("Cannot get configuration from file", err)
	}

	// マルチプレクサを用意する．
	mux := http.NewServeMux()

	// ウェブサイト表示に用いるファイル群を取得する．
	files := http.FileServer(http.Dir("game"))
	mux.Handle("/game/", http.StripPrefix("/game/", files))

	// ハンドラを登録する．
	mux.HandleFunc("/", processGame) // TODO: タイトル画面の表示
	mux.HandleFunc("/game", processGame)

	// サーバーを起動する．
	server := &http.Server{
		Addr:    config.Address,
		Handler: mux,
	}
	fmt.Print("Running server...")
	server.ListenAndServe()
}
