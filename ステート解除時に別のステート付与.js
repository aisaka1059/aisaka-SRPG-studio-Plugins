/*--------------------------------------------------------------------------
※注意※

こちらの機能はステート操作.jsに統合されました(2025/10/31)
現在こちらを使う必要はありません。
ここは削除してもいいですが、こちらを使っていた人の誘導のために残しておきます

概要：
・ステートが解除された時に指定したステートを付与します

使用方法：
・解除されるステートのカスタムパラメータに {assignment: [1, 2, 3] } のように書いてください
・以上の例だと何らかのステートが解除されたときにidが1,2,3のステートが付与されます
・付与したいステートが1つの場合でも {assignment: [1] } のように[]は外さないでください

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.313

更新履歴：
2025/07/13　作成
2025/07/14　戦闘時の自動解除でも適用されるように修正
2025/10/31　機能が　ステート操作.js　に統合された

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

(function () {
    StateControl.arrangeState = function (unit, state, increaseType) {
        var turnState = null;
        var list = unit.getTurnStateList();
        var count = list.getCount();
        var editor = root.getDataEditor();

        if (increaseType === IncreaseType.INCREASE) {
            turnState = this.getTurnState(unit, state);
            if (turnState !== null) {
                // 既に追加されていた場合はターン数を更新
                turnState.setTurn(state.getTurn());
            }
            else {
                if (count < DataConfig.getMaxStateCount()) {
                    turnState = editor.addTurnStateData(list, state);
                }
            }
        }
        else if (increaseType === IncreaseType.DECREASE) {
            editor.deleteTurnStateData(list, state);

            // ステート解除時に別のステートを付与
            if (state.custom.assignment) {
                var stateList = root.getBaseData().getStateList();
                var ids;
                var i;

                if (state.custom.assignment) {
                    ids = state.custom.assignment;
                }
                else {
                    ids = [state.custom.assignment];
                }

                for (i = 0; i < ids.length; i++) {
                    var id = ids[i];
                    var newState = stateList.getDataFromId(id);

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

    StateAutoRemovalFlowEntry._removeState = function (list, turnState, unit) {
        var count = turnState.getRemovalCount() - 1;

        if (count > 0) {
            turnState.setRemovalCount(count);
            return;
        }

        root.getDataEditor().deleteTurnStateData(list, turnState.getState());
        var state = turnState.getState()
        // ステート解除時に別のステートを付与
        if (state.custom.assignment) {
            var stateList = root.getBaseData().getStateList();
            var ids;
            var i;

            if (state.custom.assignment) {
                ids = state.custom.assignment;
            }
            else {
                ids = [state.custom.assignment];
            }

            for (i = 0; i < ids.length; i++) {
                var id = ids[i];
                var newState = stateList.getDataFromId(id);

                if (newState) {
                    StateControl.arrangeState(unit, newState, IncreaseType.INCREASE);
                }
            }
        }
    };
})();
