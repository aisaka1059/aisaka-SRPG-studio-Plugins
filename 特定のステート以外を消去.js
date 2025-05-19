/*--------------------------------------------------------------------------

概要：
・指定したステート”以外”のステートを全て剥がします。対象は任意で選択できます

使用方法：
・コード実行に

Fnc_StateEraseExcept.stateEraseExceptControl([1, 2, 3], false, false, true, false);

のように書いてください()の中は順に　残ってほしいステートのＩＤ、オリジナルデータのユニットで選択した一人、プレイヤーユニット全員、エネミーユニット全員、同盟ユニット全員　です

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.312

更新履歴：
2025/05/19　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
var Fnc_StateEraseExcept = {
    stateEraseExceptControl: function (ids, one, player, enemy, arry) {
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        if (one) {
            var content = root.getEventCommandObject().getOriginalContent();
            if (!content) return;

            var unit = content.getUnit();
            var list = unit.getTurnStateList();
            var count = list.getCount();

            this._modifyStateEraseExcept(ids, unit, list, count);
        }

        if (player) {
            var playerList = PlayerList.getAliveList();
            this._getStateList(ids, playerList, playerList.getCount());
        }

        if (enemy) {
            var enemyList = EnemyList.getAliveList();
            this._getStateList(ids, enemyList, enemyList.getCount());
        }

        if (arry) {
            var allyList = AllyList.getAliveList();
            this._getStateList(ids, allyList, allyList.getCount());
        }
    },

    _getStateList: function (ids, unitList, unitCount) {
        var i;
        for (i = 0; i < unitCount; i++) {
            var unit = unitList.getData(i);
            var stateList = unit.getTurnStateList();
            var stateCount = stateList.getCount();

            this._modifyStateEraseExcept(ids, unit, stateList, stateCount);
        }
    },

    _modifyStateEraseExcept: function (ids, unit, list, count) {
        var i, j, keep = false;
        for (i = count - 1; i >= 0; i--) {
            var turnstate = list.getData(i);
            var state = turnstate.getstate();
            var stateId = state.getId();

            // 配列内に stateId が含まれているかを手動チェック
            keep = false;
            for (j = 0; j < ids.length; j++) {
                if (ids[j] === stateId) {
                    keep = true;
                    break;
                }
            }

            // 含まれていないもの（＝除外）を削除
            if (!keep) {
                StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
            }
        }
    }
};
