package slice

import (
	"html/template"
	"net/http"

	"appengine"
	"appengine/datastore"
	"appengine/user"

	"io/ioutil"
	"log"
	"encoding/json"
)

import (
	"model"
)

func surfaceError(w http.ResponseWriter, err error) bool {
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return true
	}
	return false
}

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
	if (surfaceError(w, err)) { return }

	err = model.InitializeTools(c, "server/tools.json")
	if (surfaceError(w, err)) { return }

	_, err = w.Write([]byte("datastore initialized"))
	if (surfaceError(w, err)) { return }
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
	UserDisplayName string
	UserInfo model.UserInfo
	LevelData []model.LevelCompleted
	ToolMap map[string]model.ToolInfo
}
func root(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := requireLogin(c, w, r)
	if u == nil {
		return // will return after login
	}

	toolMap, err := model.GetAllTools(c)
	if (surfaceError(w, err)) { return }

	info, err := getInfoForUser(c, u)
	if (surfaceError(w, err)) { return }

	tmplData := &HomeTmplData{
		UserDisplayName: u.String(),
		UserInfo: *info,
		LevelData: []model.LevelCompleted{},
		ToolMap: *toolMap,
	}
	levels, err := model.ListLevelIDs(c)
	for _, levelID := range levels {
		lc, err := model.GetLevelCompleted(c, u, levelID)
		if (surfaceError(w, err)) { return }
		tmplData.LevelData = append(tmplData.LevelData, *lc)
	}

	tmplJsonBytes, err := json.Marshal(tmplData)
	if (surfaceError(w, err)) { return }
	tmplJsonStr := string(tmplJsonBytes[:])

	// TODO: why is there this two-step templating process?
	err = templates.ExecuteTemplate(w, "home.html", HomeTmplArgs{JS_DATA: tmplJsonStr})
	if (surfaceError(w, err)) { return }
}


type BuyRequest struct {
	ToolID string `json:"tool_id"`
}
func buy(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := user.Current(c)
	if u == nil {
		http.Error(w, "Not logged in", http.StatusInternalServerError)
		return
	}

    body, err := ioutil.ReadAll(r.Body)
	if (surfaceError(w, err)) { return }
	req := &BuyRequest{}
	err = json.Unmarshal(body, req)
	if (surfaceError(w, err)) { return }

	// TODO: maybe need a transaction here
	tool, err := model.GetTool(c, req.ToolID)
	if (surfaceError(w, err)) { return }
	info, err := getInfoForUser(c, u)
	if (surfaceError(w, err)) { return }

	if info.Gold < tool.Price {
		_, err = w.Write([]byte("insufficient funds"))
		if (surfaceError(w, err)) { return }
		return
	}

	k := datastore.NewKey(c, "UserInfo", info.UserID, 0, nil)
	info.Gold -= tool.Price
	info.Tools = append(info.Tools, req.ToolID)
	_, err = datastore.Put(c, k, info)
	if (surfaceError(w, err)) { return }
	_, err = w.Write([]byte("ok"))
	if (surfaceError(w, err)) { return }
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
