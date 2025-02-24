package gameplay

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
)

var girlSlice = []string{"圈姐", "真心", "闪闪", "47"}
var boySlice = []string{"柯镇恶", "季富龙", "方震", "逍遥", "小何", "达芬奇"}

func GetGroupHandler(w http.ResponseWriter, r *http.Request) {
	selectedMap := make(map[string]struct{})
	users := make([]string, 0, 5)

	for len(users) < 2 {
		user := girlSlice[rand.Intn(len(girlSlice))]
		if _, ok := selectedMap[user]; !ok {
			selectedMap[user] = struct{}{}
			users = append(users, user)
		}
	}

	for len(users) < 5 {
		user := boySlice[rand.Intn(len(boySlice))]
		if _, ok := selectedMap[user]; !ok {
			selectedMap[user] = struct{}{}
			users = append(users, user)
		}
	}

	_, _ = fmt.Fprintf(w, fmt.Sprintf("%s", users))
	log.Println(fmt.Sprintf("随机玩家为:%s", users))
}

func GetLuckBoyHandler(w http.ResponseWriter, r *http.Request) {
	user := boySlice[rand.Intn(len(boySlice))]
	_, _ = fmt.Fprintf(w, fmt.Sprintf("%s", user))
	log.Println(fmt.Sprintf("随机幸运男孩为:%s", user))
}
