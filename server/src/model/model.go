package model

import (
	"appengine"
	"appengine/datastore"
	"appengine/user"

	"io/ioutil"
	"encoding/json"
)

type UserInfo struct {
	UserID string
	Gold int
	Tools []string `datastore:",noindex"`
}
type LevelCompleted struct {
	UserID string
	LevelID string
	Stars int
}
type LevelInfo struct {
	GoldSequence []int
//	Variants []LevelVariant
}
type ToolInfo struct {
	Name string `json:"name"`
	Price int `json:"price"`
	EnergyCost int `json:"energy_cost"`
	Description string `json:"description"`
}


// initializations below
func InitializeTools(c appengine.Context, fileName string) error {
	rawData, err := ioutil.ReadFile(fileName)
	if err != nil { return err }

	var toolData map[string]ToolInfo
	err = json.Unmarshal(rawData, &toolData)
	if err != nil { return err }

	for toolId, toolInfo := range toolData {
		k := datastore.NewKey(c, "ToolInfo", toolId, 0, nil)
		_, err := datastore.Put(c, k, &toolInfo)
		if err != nil { return err }
	}
	return nil
}
func InitializeLevelIDs(c appengine.Context, fileName string) error {
	rawData, err := ioutil.ReadFile(fileName)
	if err != nil { return err }

	var levelData map[string]LevelInfo
	err = json.Unmarshal(rawData, &levelData)
	if err != nil { return err }

	for levelId, levelInfo := range levelData {
		k := datastore.NewKey(c, "LevelInfo", levelId, 0, nil)
		_, err := datastore.Put(c, k, &levelInfo)
		if err != nil { return err }
	}
	return nil
}


// ToolInfo API
func GetAllTools(c appengine.Context) (*map[string]ToolInfo, error) {
	ret := make(map[string]ToolInfo)
	q := datastore.NewQuery("ToolInfo") // TODO: limit

    for t := q.Run(c); ; {
		tool := ToolInfo{}
		key, err := t.Next(&tool)
        if err == datastore.Done {
			break
        }
        if err != nil {
			return &ret, err
        }
		ret[key.StringID()] = tool
	}
	return &ret, nil
}
func GetTool(c appengine.Context, toolID string) (*ToolInfo, error) {
	k := datastore.NewKey(c, "ToolInfo", toolID, 0, nil)

	ret := &ToolInfo{}
	err := datastore.Get(c, k, ret)
	if err != nil { return nil, err }
	return ret, nil
}


// LevelInfo API below
func ListLevelIDs(c appengine.Context) ([]string, error) {
	ret := []string{}
	q := datastore.NewQuery("LevelInfo").KeysOnly() // TODO: limit

    for t := q.Run(c); ; {
		key, err := t.Next(nil)
        if err == datastore.Done {
			break
        }
        if err != nil {
			return ret, err
        }
		ret = append(ret, key.StringID())
	}
	return ret, nil
}
func GetLevelInfo(c appengine.Context, levelId string) (*LevelInfo, error) {
	k := datastore.NewKey(c, "LevelInfo", levelId, 0, nil)

	ret := &LevelInfo{}
	err := datastore.Get(c, k, ret)
	if err != nil { return nil, err }
	return ret, nil
}



// LevelCompleted API
func SetLevelCompleted(c appengine.Context, u *user.User, lc *LevelCompleted) error {
	keyName := u.ID + ":" + lc.LevelID
	k := datastore.NewKey(c, "LevelCompleted", keyName, 0, nil)
	_, err := datastore.Put(c, k, lc)
	return err
}
func GetLevelCompleted(c appengine.Context, u *user.User, levelId string) (*LevelCompleted, error) {
	// TODO: handle u.ID nil?
	// q := datastore.NewQuery("LevelCompleted").
	// 	Filter("UserID =", u.ID).
	// 	Filter("LevelID =", levelId)

	keyName := u.ID + ":" + levelId
	k := datastore.NewKey(c, "LevelCompleted", keyName, 0, nil)

	lc := &LevelCompleted{}
	err := datastore.Get(c, k, lc)
	if err != nil { // TODO: how to check that it's errNoSuchEntity???
		return &LevelCompleted {
			UserID: u.ID,
			LevelID: levelId,
			Stars: 0,
		}, nil
	}
	return lc, nil
}
