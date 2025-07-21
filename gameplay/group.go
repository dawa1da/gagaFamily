package gameplay

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type Group struct {
	Users []*UserInfo `yaml:"users"`
}
type UserInfo struct {
	Name       string   `yaml:"name"`
	Position   string   `yaml:"position"`
	BanList    []string `yaml:"banList"`
	WeightList []string `yaml:"weightList"`
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

	if len(group.Users) != 10 {
		_, _ = fmt.Fprintf(w, "配置文件里用户数量不为10")
		return
	}

	positions := []string{"对抗路", "打野", "中路", "发育路", "游走"}
	positions = append(positions, positions...)

	//打乱一下玩家顺序，然后顺序分配分路就好了，实现随机分路
	rand.Shuffle(len(group.Users), func(i, j int) {
		group.Users[i], group.Users[j] = group.Users[j], group.Users[i]
	})

	for i, user := range group.Users {
		group.Users[i].Position = positions[i]
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
			_, _ = fmt.Fprintf(w, fmt.Sprintf("\n"))
		}
	}
}

func contains(arr []string, target string) bool {
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
