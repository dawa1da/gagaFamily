package gameplay

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
)

var heroLock, userLock sync.RWMutex

func HeroYamlHandler(w http.ResponseWriter, r *http.Request) {
	heroFileBytes, _ := os.ReadFile("hero.yaml")
	_, _ = fmt.Fprintf(w, fmt.Sprintf("%s\n", string(heroFileBytes)))
}

func HeroEditHandler(w http.ResponseWriter, r *http.Request) {
	heroLock.Lock()
	defer heroLock.Unlock()

	body, _ := io.ReadAll(r.Body)
	defer func() { _ = r.Body.Close() }()

	_ = os.WriteFile("hero.yaml", body, 0644)
	_, _ = fmt.Fprintf(w, "hero.yaml文件修改成功")
}

func UserYamlHandler(w http.ResponseWriter, r *http.Request) {
	userFileBytes, _ := os.ReadFile("user.yaml")
	_, _ = fmt.Fprintf(w, fmt.Sprintf("%s\n", string(userFileBytes)))
}

func UserEditHandler(w http.ResponseWriter, r *http.Request) {
	userLock.Lock()
	defer userLock.Unlock()

	body, _ := io.ReadAll(r.Body)
	defer func() { _ = r.Body.Close() }()

	_ = os.WriteFile("user.yaml", body, 0644)
	_, _ = fmt.Fprintf(w, "user.yaml文件修改成功")
}
