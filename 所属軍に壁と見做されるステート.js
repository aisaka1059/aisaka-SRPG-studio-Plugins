/*--------------------------------------------------------------------------

概要：
・このステートが付与されているユニットは所属軍のユニットから壁と認識されます（そのユニットの上を通れなくなります）

使用方法：
・ステートのカスタムパラメータに {hudou:true} と入れて下さい

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.310

更新履歴：
2025/04/08　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
(function () {

	BlockerRule.state = defineObject(BaseBlockerRule,
		{
			isRuleApplicable: function (unit) {
				return true;
			},

			isTargetBlocker: function (unit, targetUnit) {

				if (!FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
					list = targetUnit.getTurnStateList();
					count = list.getCount();
					var i;
					for (i = 0; i < count; i++) {
						state = list.getData(i).getstate()
						root.log(state.getName())
						if (state.custom.hudou) {
							return true;
						}


					}
					return false;
				}

				return true;
			}
		}
	);

	var alias1 = SimulationBlockerControl._configureBlockerRule;
	SimulationBlockerControl._configureBlockerRule = function (groupArray) {
		alias1.call(this, groupArray);
		groupArray.appendObject(BlockerRule.state);
	};

})();
