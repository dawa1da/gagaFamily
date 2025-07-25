package gameplay

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/patrickmn/go-cache"
	"gopkg.in/yaml.v3"
)

var c = cache.New(10*time.Second, 0)

type Group struct {
	Users []*UserInfo `yaml:"users"`
}
type UserInfo struct {
	Name       string   `yaml:"name"`
	Position   string   `yaml:"position"`
	BanList    []string `yaml:"banList"`
	WeightList []string `yaml:"weightList"`
	Disable    bool     `yaml:"disable"`
}

type Hero struct {
	Positions map[string][]string `yaml:"hero"`
}

func GetGroupHandler(w http.ResponseWriter, r *http.Request) {
	userFileBytes, _ := os.ReadFile("user.yaml")
	group := new(Group)
	_ = yaml.Unmarshal(userFileBytes, group)
	heroFileBytes, _ := os.ReadFile("hero.yaml")
	hero := new(Hero)
	hero.Positions = make(map[string][]string)
	_ = yaml.Unmarshal(heroFileBytes, hero.Positions)

	positions := []string{"对抗路", "打野", "中路", "发育路", "游走"}
	positions = append(positions, positions...)

	enabled := make([]*UserInfo, 0)
	for _, u := range group.Users {
		if !u.Disable {
			enabled = append(enabled, u)
		}
	}

	if len(enabled) != 10 {
		_, _ = fmt.Fprintf(w, fmt.Sprintf("启用的玩家数量不为10！！！\n"))
		return
	}

	//打乱一下玩家顺序，然后顺序分配分路就好了，实现随机分路
	rand.Shuffle(len(enabled), func(i, j int) {
		enabled[i], enabled[j] = enabled[j], enabled[i]
	})

	_, _ = fmt.Fprintf(w, fmt.Sprintf("----------------------------------\n"))
	for i, user := range enabled {
		enabled[i].Position = positions[i]
		userHeroPool := make([]string, len(hero.Positions[positions[i]]))
		copy(userHeroPool, hero.Positions[positions[i]])

		for _, weightHero := range user.WeightList {
			if strings.Contains(weightHero, "*") {
				ss := strings.Split(weightHero, "*")
				if !contains(userHeroPool, ss[0]) {
					continue
				}

				counts, _ := strconv.Atoi(ss[1])
				for j := 0; j < counts; j++ {
					userHeroPool = append(userHeroPool, ss[0])
				}
			} else {
				if !contains(userHeroPool, weightHero) {
					continue
				}
				userHeroPool = append(userHeroPool, weightHero)
			}
		}
		for _, banHero := range user.BanList {
			userHeroPool = removeString(userHeroPool, banHero)
		}

		_, _ = fmt.Fprintf(w, fmt.Sprintf("[%s]玩家为[%s]随机英雄为[%s]\n", user.Position, user.Name, getRandomString(userHeroPool)))
		if i == 4 {
			_, _ = fmt.Fprintf(w, fmt.Sprintf("----------------------------------\n"))
		}
	}
	_, _ = fmt.Fprintf(w, fmt.Sprintf("----------------------------------\n"))

	ip := strings.Split(r.RemoteAddr, ":")[0]
	c.Set(fmt.Sprintf("%s-%s", ip, generateCaptcha()), struct{}{}, cache.DefaultExpiration)

	count := 0
	for k := range c.Items() {
		if strings.Contains(k, ip) {
			count++
		}
	}

	_, _ = fmt.Fprintf(w, fmt.Sprintf("[%s]10秒内请求分组次数为%d\n", ip, count))

}

func contains[T comparable](arr []T, target T) bool {
	for _, item := range arr {
		if item == target {
			return true
		}
	}
	return false
}

func getRandomString(arr []string) string {
	if len(arr) == 0 {
		return ""
	}
	index := rand.Intn(len(arr))
	return arr[index]
}

func removeString(input []string, target string) []string {
	var result []string
	for _, str := range input {
		if str != target {
			result = append(result, str)
		}
	}
	return result
}

func generateCaptcha() string {
	digits := "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789"
	captcha := ""
	for i := 0; i < 6; i++ {
		captcha += string(digits[rand.Intn(len(digits))])
	}
	return captcha
}
