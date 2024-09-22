/*--------------------------------------------------------------------------

概要：
・このスキルを所持しているユニットに攻撃をした場合、攻撃したユニットにステートを付与します
・発動率を0％にしていても絶対に発動します。（発動率確認をするとエラーを起こしたため削除しています）

使用方法：
・カスタムスキルのキーワードに StateDeffense と入れて、カスタムパラメータに {stateid:XX}のように書いてください（xxは付与したいステートのid）

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.300

更新履歴：
2024/09/21　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
(function () {

    AttackEvaluator.HitCritical._checkStateDeffense = function (virtualActive, virtualPassive, attackEntry) {

        var i, count, skill, state;
        var arr = SkillControl.getDirectSkillArray(virtualPassive.unitSelf, SkillType.CUSTOM, 'StateDeffense');

        count = arr.length;
        for (i = 0; i < count; i++) {
            skill = arr[i].skill;
            state = AttackEvaluator.HitCritical._GetState(skill);

            if (StateControl.isStateBlocked(virtualActive.unitSelf, virtualPassive.unitSelf, state)) {
                // ステートは無効化されるため発動しない
                continue;
            }

            // Passive側はスキルが発動したからskillArrayPassivesに追加
            if (skill.isSkillDisplayable()) {
                attackEntry.skillArrayPassive.push(skill);
            }

            // Active側はステートを受けるからstateArrayActiveに追加
            attackEntry.stateArrayActive.push(state);

            // 戦闘全体に渡ってステートを記録する
            virtualActive.stateArray.push(state);
        }

    };

    AttackEvaluator.HitCritical._GetState = function (skill) {
        var id = skill.custom.stateid;
        var list = root.getBaseData().getStateList();

        return list.getDataFromId(id);
    };

    alias1 = AttackEvaluator.HitCritical.evaluateAttackEntry;
    AttackEvaluator.HitCritical.evaluateAttackEntry = function (virtualActive, virtualPassive, attackEntry) {
        var result = alias1.call(this, virtualActive, virtualPassive, attackEntry);
        AttackEvaluator.HitCritical._checkStateDeffense(virtualActive, virtualPassive, attackEntry);
        return result;
    };

})();
