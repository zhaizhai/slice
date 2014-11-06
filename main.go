package slice

import (
	"html/template"
	"net/http"

	"appengine"
	"appengine/datastore"
	"appengine/user"

	"io/ioutil"
//	"strconv"
	"log"
	"encoding/json"
//	"strings"
)

import (
	"model"
)


var APP_ID = "slice-game"
var templates = template.Must(template.ParseFiles("home.html", "index.html"))
func init() {
	http.HandleFunc("/", root)
	http.HandleFunc("/level", level)
	http.HandleFunc("/buy", buy)
	http.HandleFunc("/complete_level", completeLevel)

	// XXXX: this is a stupid hack to initialize data because
	// datastore admin interface sucks
	http.HandleFunc("/initialize", initialize)
}
func initialize(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	err := model.InitializeLevelIDs(c, "server/levels.json")
	if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
	_, err = w.Write([]byte("datastore initialized"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}


func requireLogin(c appengine.Context, w http.ResponseWriter, r *http.Request) *user.User {
    u := user.Current(c)
    if u != nil {
        return u
    }

    url, err := user.LoginURL(c, r.URL.String())
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return nil
    }
    w.Header().Set("Location", url)
    w.WriteHeader(http.StatusFound)
    return nil
}

func getInfoForUser(c appengine.Context, u *user.User) (*model.UserInfo, error) {
	// TODO: handle u.ID nil?
	k := datastore.NewKey(c, "UserInfo", u.ID, 0, nil)

	ret := &model.UserInfo{}
	err := datastore.Get(c, k, ret)

	if err != nil { // TODO: how to check that it's errNoSuchEntity???
		log.Print("error ", err)

		ret = &model.UserInfo{
			UserID: u.ID,
			Gold: 0,
			Tools: []string{},
		}
		_, err := datastore.Put(c, k, ret)
		if err != nil {
			return nil, err
		}
	}

	return ret, nil
}


type HomeTmplArgs struct {
	JS_DATA string
}
type HomeTmplData struct {
	UserInfo model.UserInfo
	LevelData []model.LevelCompleted
}
func root(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := requireLogin(c, w, r)
	if u == nil {
		return // will return after login
	}

	info, err := getInfoForUser(c, u)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tmplData := &HomeTmplData{
		UserInfo: *info,
		LevelData: []model.LevelCompleted{},
	}
	levels, err := model.ListLevelIDs(c)
	for _, levelID := range levels {
		lc, err := model.GetLevelCompleted(c, u, levelID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		tmplData.LevelData = append(tmplData.LevelData, *lc)
	}

	tmplJsonBytes, err := json.Marshal(tmplData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmplJsonStr := string(tmplJsonBytes[:])

	// TODO: why is there this two-step templating process?
	err = templates.ExecuteTemplate(w, "home.html", HomeTmplArgs{JS_DATA: tmplJsonStr})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func buy(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := user.Current(c)
	if u == nil {
		http.Error(w, "Not logged in", http.StatusInternalServerError)
		return
	}

	info, err := getInfoForUser(c, u)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	k := datastore.NewKey(c, "UserInfo", info.UserID, 0, nil)
	info.Gold -= 10
	info.Tools = append(info.Tools, "locator")

	log.Print("info now", info)
	_, err = datastore.Put(c, k, info)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = w.Write([]byte("ok"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}


type CompleteLevelRequest struct {
	LevelID string
	Stars int
}
func completeLevel(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := user.Current(c)
	if u == nil {
		http.Error(w, "Not logged in", http.StatusInternalServerError)
		return
	}

    body, err := ioutil.ReadAll(r.Body)
    if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
    }
	req := &CompleteLevelRequest{}
	err = json.Unmarshal(body, req)
    if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
    }

	lc, err := model.GetLevelCompleted(c, u, req.LevelID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if (req.Stars > lc.Stars) {
		// TODO: should be inside a transaction...

		// give user some gold
		info, err := getInfoForUser(c, u)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		levelInfo, err := model.GetLevelInfo(c, req.LevelID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for i := lc.Stars; i < req.Stars; i++ {
			info.Gold += levelInfo.GoldSequence[i]
		}
		k := datastore.NewKey(c, "UserInfo", info.UserID, 0, nil)
		_, err = datastore.Put(c, k, info)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// update the level completed info
		err = model.SetLevelCompleted(c, u, &model.LevelCompleted{
			UserID: u.ID,
			LevelID: req.LevelID,
			Stars: req.Stars,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// TODO: maybe return amount of gold earned or something
	// success
	_, err = w.Write([]byte("ok"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func level(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := requireLogin(c, w, r)
	if u == nil {
		return // will return after login
	}

	// TODO: why is there this two-step templating process?
	err := templates.ExecuteTemplate(w, "index.html", nil /* no params */)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
