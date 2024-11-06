/*--------------------------------------------------------------------------

概要：
・このスキルを所持しているユニットは、本来戦闘で受けるはずだったダメージの分だけ回復します

使用方法：
・カスタムスキルのキーワードに damage_absorb と入れて、スキルの”有効相手”で吸収したい武器、または武器種を設定してください
・私は確認する術を持ちませんが、バージョンを古いまま固定している方は”有効相手”の欄が存在しないかもしれません

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.303

更新履歴：
2024/11/07　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

(function () {

	AttackEvaluator.ActiveAction._getDamageabsorb = function (virtualActive, virtualPassive, attackEntry) {
		var i, count, skill, flag;
		var value1 = -1;
		var arr = SkillControl.getDirectSkillArray(virtualPassive.unitSelf, SkillType.CUSTOM, 'damage_absorb');

		count = arr.length;
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			flag = skill.getSkillValue();
			// 吸収できる武器であるか調べる
			if (!skill.getTargetAggregation().isConditionFromWeapon(virtualActive, virtualActive.weapon)) {
				continue;
			}
			if (!SkillRandomizer.isCustomSkillInvokedInternal(virtualPassive.unitSelf, virtualActive.unitSelf, skill, 'damage_absorb')) {
				// スキルの発動率が成立しなかった
				continue;
			}
			if (skill.isSkillDisplayable()) {
				attackEntry.skillArrayPassive.push(skill);
			}
			value1 = skill.getSkillValue();

			break;
		}
		return value1;
	};

	var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
	SkillRandomizer.isCustomSkillInvokedInternal = function (active, passive, skill, keyword) {
		if (keyword === 'damage_absorb') {
			// 発動率を満たしているかを調べる
			return this._isSkillInvokedInternal(active, passive, skill);
		}

		// サポートできるスキルでない場合は、既定のメソッドを呼び出す。
		// これを忘れると、他の開発者のスキルが考慮される機会がなくなる。
		return alias1.call(this, active, passive, skill, keyword);
	};


	var alias2 = AttackEvaluator.ActiveAction._arrangePassiveDamage;
	AttackEvaluator.ActiveAction._arrangePassiveDamage = function (virtualActive, virtualPassive, attackEntry) {
		alias2.call(this, virtualActive, virtualPassive, attackEntry);
		var damagePassive = attackEntry.damagePassive;
		var value1 = AttackEvaluator.ActiveAction._getDamageabsorb(virtualActive, virtualPassive, attackEntry);

		if (value1 !== -1) {

			damagePassive = damagePassive * -1;
		}
		return damagePassive;
	};
})();
