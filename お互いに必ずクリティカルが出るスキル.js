/*--------------------------------------------------------------------------
    
概要：
・スキル所持者が戦闘する場合、双方の攻撃が必ずクリティカルになります。

使用方法：
・カスタムスキルのキーワードに
  alwaysCritical
  と入力してください。
  また、カスタムパラメータに

{
	ignoreCriticalInvalid: false
}

と書けば、クリティカル無効スキルを所持しているユニットはこのスキルの効果でもクリティカルを受けなくなります。デフォルトだとクリティカルが発動します


製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.321

更新履歴：
2026/05/23　作成

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

		if (keyword === 'alwaysCritical') {
			return this._isSkillInvokedInternal(active, passive, skill);
		}

		return alias1.call(this, active, passive, skill, keyword);
	};

	var alias2 = AttackEvaluator.HitCritical.isCritical;

	AttackEvaluator.HitCritical.isCritical = function (virtualActive, virtualPassive, attackEntry) {

		var active = virtualActive.unitSelf;
		var passive = virtualPassive.unitSelf;

		var activeSkill = SkillControl.getPossessionCustomSkill(active, 'alwaysCritical');
		var passiveSkill = SkillControl.getPossessionCustomSkill(passive, 'alwaysCritical');

		// 誰も所持していない
		if (activeSkill === null && passiveSkill === null) {
			return alias2.call(this, virtualActive, virtualPassive, attackEntry);
		}

		// スキル表示
		if (activeSkill !== null) {
			SkillControl.checkAndPushCustomSkill(active, passive, attackEntry, true, 'alwaysCritical');
		}

		if (passiveSkill !== null) {
			SkillControl.checkAndPushCustomSkill(passive, active, attackEntry, false, 'alwaysCritical');
		}

		// passive側のクリティカル無効確認
		var invalidSkill = SkillControl.getBattleSkillFromFlag(passive, active, SkillType.INVALID, InvalidFlag.CRITICAL);

		// 無効スキル無し
		if (invalidSkill === null) {
			return true;
		}

		// デフォルトは true
		var ignoreInvalid = true;

		// active優先
		if (activeSkill !== null) {

			if (activeSkill.custom.ignoreCriticalInvalid === false) {
				ignoreInvalid = false;
			}
			else if (activeSkill.custom.ignoreCriticalInvalid === true) {
				ignoreInvalid = true;
			}
		}
		else if (passiveSkill !== null) {

			if (passiveSkill.custom.ignoreCriticalInvalid === false) {
				ignoreInvalid = false;
			}
			else if (passiveSkill.custom.ignoreCriticalInvalid === true) {
				ignoreInvalid = true;
			}
		}

		return ignoreInvalid;
	};

})();
