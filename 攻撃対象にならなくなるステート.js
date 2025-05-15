/*--------------------------------------------------------------------------

概要：
・このステートが付与されているユニットは撃対象にならなくなります
・プレイヤーはそもそもカーソルを合わせることができなくなり、エネミーはステートが付加されているユニットを攻撃しなくなります

使用方法：
・ステートのカスタムパラメータに {camouflage:true} と入れて下さい

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.312

更新履歴：
2025/05/16　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
(function () {

    AttackChecker.getAttackIndexArray = function (unit, weapon, isSingleCheck) {

        var i, index, x, y, targetUnit;
        var indexArrayNew = [];
        var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
        var count = indexArray.length;

        for (i = 0; i < count; i++) {
            index = indexArray[i];
            x = CurrentMap.getX(index);
            y = CurrentMap.getY(index);
            targetUnit = PosChecker.getUnitFromPos(x, y);

            if (targetUnit !== null && unit !== targetUnit) {
                if (FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
                    root.log(targetUnit.getName());

                    var list = targetUnit.getTurnStateList();
                    var count2 = list.getCount();
                    var j;
                    var hasCamouflage = false;

                    for (j = 0; j < count2; j++) {
                        var state = list.getData(j).getState();
                        if (state.custom.camouflage) {
                            hasCamouflage = true;
                            break;
                        }
                    }

                    if (!hasCamouflage) {
                        indexArrayNew.push(index);
                        if (isSingleCheck) {
                            return indexArrayNew;
                        }
                    }
                }
            }
        }

        return indexArrayNew;
    };

})();
