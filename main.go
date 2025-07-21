package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"time"

	"gagaFamily/gameplay"
)

func init() {
	rand.NewSource(time.Now().UnixNano())
}

func main() {
	http.HandleFunc("/gagaFamily/game", htmlHandler)
	//配置文件
	http.HandleFunc("/gagaFamily/conf/heroYaml", gameplay.HeroYamlHandler)
	http.HandleFunc("/gagaFamily/conf/heroEdit", gameplay.HeroEditHandler)
	http.HandleFunc("/gagaFamily/conf/userYaml", gameplay.UserYamlHandler)
	http.HandleFunc("/gagaFamily/conf/userEdit", gameplay.UserEditHandler)

	//分组系统
	http.HandleFunc("/gagaFamily/group/getGroup", gameplay.GetGroupHandler)

	fmt.Println("Starting server on :8008")
	_ = http.ListenAndServe(":8008", nil)
}

func htmlHandler(w http.ResponseWriter, r *http.Request) {
	content, err := os.ReadFile("gaga.html")
	if err != nil {
		http.Error(w, "Failed to load HTML file", http.StatusInternalServerError)
		return
	}

	// 设置响应头的Content-Type为text/html
	w.Header().Set("Content-Type", "text/html")
	// 将HTML内容写入响应
	_, _ = w.Write(content)
}
