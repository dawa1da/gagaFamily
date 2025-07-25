package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
	"gagaFamily/gameplay"
)

func init() {
	rand.NewSource(time.Now().UnixNano())
}

func main() {
    // http.HandleFunc("/gagaFamily/game", htmlHandler)
	http.Handle("/gagaFamily/game/src/", http.StripPrefix("/gagaFamily/game/src/", http.FileServer(http.Dir("src"))))
	http.HandleFunc("/gagaFamily/game/", func(w http.ResponseWriter, r *http.Request) {
        // 只允许 .html 文件
        if strings.HasSuffix(r.URL.Path, ".html") {
            // 去掉前缀，得到文件名
            filename := strings.TrimPrefix(r.URL.Path, "/gagaFamily/game/")
            // 防止目录穿越攻击
            if strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
                http.NotFound(w, r)
                return
            }
            http.ServeFile(w, r, filename)
            return
        }
        http.NotFound(w, r)
    })
	//配置文件
	http.HandleFunc("/gagaFamily/conf/heroYaml", gameplay.HeroYamlHandler)
	http.HandleFunc("/gagaFamily/conf/heroEdit", gameplay.HeroEditHandler)
	http.HandleFunc("/gagaFamily/conf/userYaml", gameplay.UserYamlHandler)
	http.HandleFunc("/gagaFamily/conf/userEdit", gameplay.UserEditHandler)

	//分组系统
	http.HandleFunc("/gagaFamily/group/getGroup", gameplay.GetGroupHandler)
	//卧底系统
	http.HandleFunc("/gagaFamily/undercover/get", gameplay.GetUndercoverHandler)
	http.HandleFunc("/gagaFamily/undercover/reset", gameplay.ResetUndercoverHandler)

	fmt.Println("Starting server on :8008")
	_ = http.ListenAndServe(":8008", nil)
}

func htmlHandler(w http.ResponseWriter, r *http.Request) {

	//周四彩蛋
	if time.Now().Weekday() == time.Thursday && rand.Intn(5) == 0 {
		http.Redirect(w, r, "https://m.kfc.com.cn/", http.StatusFound)
		return
	}

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
