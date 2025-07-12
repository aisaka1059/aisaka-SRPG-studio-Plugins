/*--------------------------------------------------------------------------

概要：
・ステートが解除された時に指定したステートを付与します

使用方法：
・解除されるステートのカスタムパラメータに {assignment: [1, 2, 3] } のように書いてください
・以上の例だと何らかのステートが解除されたときにidが1,2,3のステートが付与されます
・付与したいステートが1つの場合でも {assignment: [1] } のように[]は外さないでください

・戦闘時に解除されるステートは処理が違うらしく、そちらの対応はできていません。後日対応する予定です

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.313

更新履歴：
2025/07/13　作成

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
})();
