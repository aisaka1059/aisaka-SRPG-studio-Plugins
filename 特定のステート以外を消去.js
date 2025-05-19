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
