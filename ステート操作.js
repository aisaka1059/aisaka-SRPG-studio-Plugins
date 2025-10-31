/*--------------------------------------------------------------------------

※注意※

私が作成した
ステート解除時に別のステート付与.js
または
ステートのターン数を増減させるプラグイン
を導入している人はそれらを抜いてこれ1つだけ入れてください。競合を起こしてエラーを吐きます


概要：
・ステートのターン増減
・ステートの現在ターンをn倍にする
・ステート解除時に別のステート付与
・バッドステート予防ステート（新規機能）
・既に付与されているステートと同じステートが付与される場合残りターン数を加算できる機能（新規機能）

の5つを扱うことができます

使用方法：
▼ターン増減
 コード実行に

 Fnc_ChangeStateTurn._StateTurnControl(1, 5, false, true, true, false);
 のように書いてください

 ()の中身は順に　増減したいステートのid, 増減させたいターン(正の値なら増加、負の値なら減少), オリジナルデータのユニットのみ対象, プレイヤーユニット全員, エネミーユニット全員, 同盟ユニット全員　です
 例だと、プレイヤーユニットとエネミーユニット全員のid1のステートが5ターン延長されます

▼ターンn倍
 コード実行に

 Fnc_ChangeStateTurn._MultiplyStateTurn(5, 2, true, false, false, false);

 のように書いてください
 例だと、オリジナルデータで選択したユニットのみid5のステートが2倍になります

▼解除時付与
 解除対象ステートのカスタムパラメータに

 { assignment: [1, 2, 3] }

 のように書いてください。例だと何らかのステートが解除されたときに1,2,3のステートが付与されます

▼バッドステート予防
 ステートのカスタムパラメータに

 { preventBadState: true }

 のように書いてください。防げる回数は残りターン数に依存します
 ターン開始時に残りターンは減少してしまいますが、上のステートのターン増減機能でターン開始時に+1してあげれば実質的にターンは減ってないものとみなせます
 ステートでプレイヤーが確認できる数字がそれしかなかったので苦肉の策です

▼残りターン数加算
 ステートのカスタムパラメータに

 {addstate: true}

 と書いてください。そのステートだけターンが加算されるようになります



そして以上の機能は複合して使用することが可能です。例えば「バッドステートを防いで、重ね掛けしたらターン数が伸びて、解除されたらid1,2,3のステートを付与する」ステートを作りたい！としたなら

{
  preventBadState: true,   // バッドステートを防ぐ
  addstate: true,           // 再付与時に残りターンを加算
  assignment: [1, 2, 3]
}

と書けばいいです

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.313

更新履歴：
2025/10/31　作成
2025/11/01　滅茶苦茶だったので作り直し。そして5つ目のターン加算機能追加

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

//-------------------------------------------------------
// ステートターン増減・倍率変更機能
//-------------------------------------------------------
var Fnc_ChangeStateTurn = {

    //---------------------------------------------------
    // 残りターン増減
    //---------------------------------------------------
    _StateTurnControl: function (Id, turn, one, player, enemy, ally) {
        if (one === true) {
            var content = root.getEventCommandObject().getOriginalContent();
            var unit = content.getUnit();
            var list = unit.getTurnStateList();
            var count = list.getCount();
            this._modifyTurnState(Id, turn, unit, list, count);
        }

        if (player === true) {
            var playerList = PlayerList.getAliveList();
            this._getStateList(Id, turn, playerList, playerList.getCount());
        }
        if (enemy === true) {
            var enemyList = EnemyList.getAliveList();
            this._getStateList(Id, turn, enemyList, enemyList.getCount());
        }
        if (ally === true) {
            var allyList = AllyList.getAliveList();
            this._getStateList(Id, turn, allyList, allyList.getCount());
        }
    },

    _getStateList: function (Id, turn, unitList, unitCount) {
        for (var i = 0; i < unitCount; i++) {
            var unit = unitList.getData(i);
            var stateList = unit.getTurnStateList();
            var stateCount = stateList.getCount();
            this._modifyTurnState(Id, turn, unit, stateList, stateCount);
        }
    },

    _modifyTurnState: function (Id, turn, unit, list, count) {
        for (var i = 0; i < count; i++) {
            var turnState = list.getData(i);
            var state = turnState.getState();
            var remain = turnState.getTurn();

            if (state.getId() === Id) {
                remain += turn;
                if (remain <= 0) {
                    StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
                } else {
                    turnState.setTurn(remain);
                }
                break;
            }
        }
    },

    //---------------------------------------------------
    // 残りターン倍率変更（新機能）
    //---------------------------------------------------
    _MultiplyStateTurn: function (Id, rate, one, player, enemy, ally) {
        if (rate <= 0) return;

        if (one === true) {
            var content = root.getEventCommandObject().getOriginalContent();
            var unit = content.getUnit();
            var list = unit.getTurnStateList();
            this._applyMultiply(Id, rate, unit, list);
        }

        if (player === true) {
            var playerList = PlayerList.getAliveList();
            for (var i = 0; i < playerList.getCount(); i++) {
                var unit = playerList.getData(i);
                var list = unit.getTurnStateList();
                this._applyMultiply(Id, rate, unit, list);
            }
        }

        if (enemy === true) {
            var enemyList = EnemyList.getAliveList();
            for (var j = 0; j < enemyList.getCount(); j++) {
                var unit = enemyList.getData(j);
                var list = unit.getTurnStateList();
                this._applyMultiply(Id, rate, unit, list);
            }
        }

        if (ally === true) {
            var allyList = AllyList.getAliveList();
            for (var k = 0; k < allyList.getCount(); k++) {
                var unit = allyList.getData(k);
                var list = unit.getTurnStateList();
                this._applyMultiply(Id, rate, unit, list);
            }
        }
    },

    _applyMultiply: function (Id, rate, unit, list) {
        var count = list.getCount();
        for (var i = 0; i < count; i++) {
            var turnState = list.getData(i);
            var state = turnState.getState();
            if (state.getId() === Id) {
                var current = turnState.getTurn();
                var updated = Math.floor(current * rate);
                turnState.setTurn(updated);
                root.log(unit.getName() + " の「" + state.getName() + "」残りターンを " + current + " → " + updated + " に変更しました。");
                break;
            }
        }
    }
};

(function () {
    //-------------------------------------------------------
    // ステート付与／解除処理 + バッドステート予防
    //-------------------------------------------------------
    var _arrangeState = StateControl.arrangeState;
    StateControl.arrangeState = function (unit, state, increaseType) {
        var turnState = null;
        var list = unit.getTurnStateList();
        var count = list.getCount();
        var editor = root.getDataEditor();

        //------------------------------
        // バッドステート予防チェック（修正版）
        //------------------------------
        if (increaseType === IncreaseType.INCREASE && state.isBadState()) {
            for (var i = 0; i < count; i++) {
                var ts = list.getData(i);
                var s = ts.getState();

                if (s.custom && s.custom.preventBadState === true) {
                    // 変更点：
                    // ここでは「既に同じステートがあるか」を見ずに、予防ステートが存在すれば
                    // 常にバッドステートを無効化（＝付与を止める）します。
                    // 既存のバッドステートがあっても、再付与による上書きを防ぎます。

                    root.log("バッドステート「" + state.getName() + "」は予防ステート「" + s.getName() + "」により無効化されました");

                    // 予防ステートのターンを1減少（残り1なら解除）
                    var remain = ts.getTurn();
                    if (remain > 1) {
                        ts.setTurn(remain - 1);
                    } else {
                        // 解除（この呼び出しは再帰的にarrangeStateを呼びますが、
                        // increaseType === DECREASEなので防止ループにはならない）
                        StateControl.arrangeState(unit, s, IncreaseType.DECREASE);
                    }
                    // 付与処理を中断（既存の同一バッドステートがある場合でも上書きしない）
                    return null;
                }
            }
        }

        //------------------------------
        // 通常付与／解除処理（既存の処理をそのまま使用）
        //------------------------------
        if (increaseType === IncreaseType.INCREASE) {
            turnState = this.getTurnState(unit, state);
            if (turnState !== null) {
                // addstate対応
                if (state.custom && state.custom.addstate === true) {
                    // 残りターンを加算
                    var newTurn = turnState.getTurn() + state.getTurn();
                    turnState.setTurn(newTurn);
                    root.log("ステート「" + state.getName() + "」の残りターンを加算しました: " + newTurn);
                } else {
                    // 通常の上書き
                    turnState.setTurn(state.getTurn());
                }
            } else if (count < DataConfig.getMaxStateCount()) {
                turnState = editor.addTurnStateData(list, state);
            }
        }
        else if (increaseType === IncreaseType.DECREASE) {
            editor.deleteTurnStateData(list, state);

            // 解除時付与処理
            if (state.custom && state.custom.assignment) {
                var stateList = root.getBaseData().getStateList();
                var ids = (state.custom.assignment instanceof Array) ? state.custom.assignment : [state.custom.assignment];

                for (var k = 0; k < ids.length; k++) {
                    var newState = stateList.getDataFromId(ids[k]);
                    if (newState) {
                        StateControl.arrangeState(unit, newState, IncreaseType.INCREASE);
                    }
                }
            }
        }
        else if (increaseType === IncreaseType.ALLRELEASE) {
            editor.deleteAllTurnStateData(list);
        }

        MapHpControl.updateHp(unit);
        return turnState;
    };


    //-------------------------------------------------------
    // 自動解除時にも assignment を適用
    //-------------------------------------------------------

    var _checkState = StateAutoRemovalFlowEntry._checkState;
    StateAutoRemovalFlowEntry._checkState = function (unit, order) {
        var i, turnState, state, type;
        var list = unit.getTurnStateList();
        var count = list.getCount();
        var arr = [];

        for (i = 0; i < count; i++) {
            turnState = list.getData(i);
            if (turnState.isLocked()) {
                turnState.setLocked(false);
                continue;
            }

            state = turnState.getState();
            type = state.getAutoRemovalType();
            if (type === StateAutoRemovalType.NONE) {
                continue;
            }
            else if (type === StateAutoRemovalType.BATTLEEND) {
                arr.push(turnState);
            }
            else if (type === StateAutoRemovalType.ACTIVEDAMAGE || type === StateAutoRemovalType.PASSIVEDAMAGE) {
                if (this._checkHit(unit, order, type)) {
                    arr.push(turnState);
                }
            }
        }

        count = arr.length;
        for (i = 0; i < count; i++) {
            turnState = arr[i];
            this._removeState(list, turnState, unit);
        }
    };

    var _removeState = StateAutoRemovalFlowEntry._removeState;
    StateAutoRemovalFlowEntry._removeState = function (list, turnState, unit) {
        var count = turnState.getRemovalCount() - 1;
        if (count > 0) {
            turnState.setRemovalCount(count);
            return;
        }

        root.getDataEditor().deleteTurnStateData(list, turnState.getState());
        var state = turnState.getState();

        if (state.custom.assignment) {
            var stateList = root.getBaseData().getStateList();
            var ids = (state.custom.assignment instanceof Array) ? state.custom.assignment : [state.custom.assignment];

            for (var i = 0; i < ids.length; i++) {
                var newState = stateList.getDataFromId(ids[i]);
                if (newState) {
                    StateControl.arrangeState(unit, newState, IncreaseType.INCREASE);
                }
            }
        }
    };

})();
