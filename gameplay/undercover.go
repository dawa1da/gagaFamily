package gameplay

import (
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

var userMap sync.Map
var undercoverQuantity int8
var undercoverSlice []int8
var teamNumber string
var numberSlice []int8

func InitUndercover() {
	teamNumber = generateCaptcha()
	numberSlice = []int8{1, 2, 3, 4, 5}
	copySlice := make([]int8, len(numberSlice))
	copy(copySlice, numberSlice)
	rand.Shuffle(5, func(i, j int) { copySlice[i], copySlice[j] = copySlice[j], copySlice[i] })
	undercoverSlice = copySlice[:undercoverQuantity]

}

func GetUndercoverHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = fmt.Fprintf(w, fmt.Sprintf("队伍号%s,卧底数量为%d\n", teamNumber, undercoverQuantity))

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

	if contains(undercoverSlice, number) {
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

	body, _ := io.ReadAll(r.Body)
	defer func() { _ = r.Body.Close() }()
	bodyStr := strings.TrimSpace(string(body))
	number, _ := strconv.Atoi(bodyStr)
	undercoverQuantity = int8(number)

	InitUndercover()
	_, _ = fmt.Fprintf(w, fmt.Sprintf("队伍号重置为%s,卧底数量为%d", teamNumber, undercoverQuantity))
}
