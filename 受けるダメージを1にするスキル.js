/*--------------------------------------------------------------------------

概要：
・このスキルを所持しているユニットは直接戦闘で受けるダメージが1になります(見切りで無効化可能)
・ダメージ計算の最後に0乗しているだけです。そこを変えれば好きにいじれます

使用方法：
・カスタムスキルのキーワードに damage1 と入れてください

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.300

更新履歴：
2024/09/25　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
(function () {

    var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
    SkillRandomizer.isCustomSkillInvokedInternal = function (active, passive, skill, keyword) {
        if (keyword === 'damage1') {
            // 発動率を満たしているかを調べる
            return this._isSkillInvokedInternal(active, passive, skill);
        }

        // サポートできるスキルでない場合は、既定のメソッドを呼び出す。
        // これを忘れると、他の開発者のスキルが考慮される機会がなくなる。
        return alias1.call(this, active, passive, skill, keyword);
    };

    var alias2 = AttackEvaluator.HitCritical.calculateDamage;
    AttackEvaluator.HitCritical.calculateDamage = function (virtualActive, virtualPassive, entry) {
        var damage = alias2.call(this, virtualActive, virtualPassive, entry);

        // スキルが発動した場合は、受けるダメージを1にする
        if (SkillControl.checkAndPushCustomSkill(virtualPassive.unitSelf, virtualActive.unitSelf, entry, true, 'damage1') !== null) {
            damage = Math.pow(damage, 0);
        }

        return damage;
    };

})();
