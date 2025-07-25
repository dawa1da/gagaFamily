package gameplay

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
)

var userMap sync.Map
var undercoverNumber int8
var teamNumber string
var numberSlice []int8

func InitUndercover() {
	undercoverNumber = int8(rand.Intn(5) + 1)
	teamNumber = generateCaptcha()
	numberSlice = []int8{1, 2, 3, 4, 5}
	rand.Shuffle(5, func(i, j int) { numberSlice[i], numberSlice[j] = numberSlice[j], numberSlice[i] })
}

func GetUndercoverHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = fmt.Fprintf(w, fmt.Sprintf("队伍号%s\n", teamNumber))

	ip := strings.Split(r.RemoteAddr, ":")[0]

	var number int8
	if value, ok := userMap.Load(ip); ok {
		number = value.(int8)
	} else {
		if len(numberSlice) == 0 {
			_, _ = fmt.Fprintf(w, "当前队伍玩家已满,请重置队伍")
			return
		}

		number = numberSlice[0]
		numberSlice = numberSlice[1:]
		userMap.Store(ip, number)
	}

	if number == undercoverNumber {
		_, _ = fmt.Fprintf(w, fmt.Sprintf("你的数字是[%d],你是卧底!!!", number))
	} else {
		_, _ = fmt.Fprintf(w, fmt.Sprintf("你的数字是[%d],你不是卧底", number))
	}

	log.Println(fmt.Sprintf("%s抽取了位置", ip))
}

func ResetUndercoverHandler(w http.ResponseWriter, r *http.Request) {
	userMap.Range(func(key, value interface{}) bool {
		userMap.Delete(key)
		return true
	})

	InitUndercover()
	_, _ = fmt.Fprintf(w, fmt.Sprintf("队伍号重置为%s,卧底数量", teamNumber))
}
