package gameplay

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
)

var positionMap = map[int8]string{1: "对抗路", 2: "打野", 3: "中路", 4: "发育路", 5: "游走"}

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

func generateCaptcha() string {
	digits := "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789"
	captcha := ""
	for i := 0; i < 6; i++ {
		captcha += string(digits[rand.Intn(len(digits))])
	}
	return captcha
}

func GetUndercoverHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = fmt.Fprintf(w, fmt.Sprintf("队伍号%s\n", teamNumber))

	ip := strings.Split(r.RemoteAddr, ":")[0]

	log.Println(fmt.Sprintf("%#+v", r))

	var number int8
	if value, ok := userMap.Load(ip); ok {
		number = value.(int8)
	} else {
		if len(numberSlice) == 0 {
			_, _ = fmt.Fprintf(w, "当前队伍玩家已满")
			return
		}

		number = numberSlice[0]
		numberSlice = numberSlice[1:]
		userMap.Store(ip, number)
	}

	_, _ = fmt.Fprintf(w, fmt.Sprintf("你抽取的位置为%s\n", positionMap[number]))
	if number == undercoverNumber {
		_, _ = fmt.Fprintf(w, fmt.Sprintf("你是卧底!!!"))
	}

	log.Println(fmt.Sprintf("%s抽取了位置", ip))
}

func ResetUndercoverHandler(w http.ResponseWriter, r *http.Request) {
	userMap.Range(func(key, value interface{}) bool {
		userMap.Delete(key)
		return true
	})

	InitUndercover()
	_, _ = fmt.Fprintf(w, fmt.Sprintf("队伍号重置为%s", teamNumber))
	log.Println(fmt.Sprintf("队伍号重置为%s", teamNumber))
}

func GetUndercoverNumberHandler(w http.ResponseWriter, r *http.Request) {

	_, _ = fmt.Fprintf(w, teamNumber)
}
