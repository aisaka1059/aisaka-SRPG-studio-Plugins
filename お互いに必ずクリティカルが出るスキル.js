/*--------------------------------------------------------------------------
    
概要：
・スキル所持者が戦闘する場合、双方の攻撃が必ずクリティカルになります。

使用方法：
・カスタムスキルのキーワードに
  alwaysCritical
  と入力してください。

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

	// カスタムスキルの発動判定を追加
	var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
	SkillRandomizer.isCustomSkillInvokedInternal = function (active, passive, skill, keyword) {

		if (keyword === 'alwaysCritical') {
			// スキル発動率判定
			return this._isSkillInvokedInternal(active, passive, skill);
		}

		return alias1.call(this, active, passive, skill, keyword);
	};

	// クリティカル判定を書き換え
	var alias2 = AttackEvaluator.HitCritical.isCritical;
	AttackEvaluator.HitCritical.isCritical = function (virtualActive, virtualPassive, attackEntry) {

		var active = virtualActive.unitSelf;
		var passive = virtualPassive.unitSelf;

		// 攻撃側スキル判定
		var skill1 = SkillControl.checkAndPushCustomSkill(
			active,
			passive,
			attackEntry,
			true,
			'alwaysCritical'
		);

		// 防御側スキル判定
		var skill2 = SkillControl.checkAndPushCustomSkill(
			passive,
			active,
			attackEntry,
			false,
			'alwaysCritical'
		);

		// どちらかが発動したら必ずクリティカル
		if (skill1 !== null || skill2 !== null) {
			return true;
		}

		// 元の処理
		return alias2.call(this, virtualActive, virtualPassive, attackEntry);
	};

})();
