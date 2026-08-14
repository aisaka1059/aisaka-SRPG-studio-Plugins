/*--------------------------------------------------------------------------

概要：
・このプラグインを入れていると敵に使える回復の杖が回復量分のダメージを与えます（味方に使う場合は普段通り回復する）
・全回復の場合はユニットの最大HP分のダメージを与えます（要するに即死攻撃）
・敵に持たせた場合HP半分以下の味方を狙ってきます（これはSRPGSTUDIOの仕様）

使用方法：
・これをメモ帳にコピペして拡張子を.jsにして保存するだけでいいです

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.324

更新履歴：
2026/08/15　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
var RecoveryItemUse = defineObject(BaseItemUse,
{
	_dynamicEvent: null,

	enterMainUseCycle: function(itemUseParent)
	{
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var recoveryInfo = itemTargetInfo.item.getRecoveryInfo();
		var targetUnit = itemTargetInfo.targetUnit;
		var plus = Calculator.calculateRecoveryItemPlus(
			itemTargetInfo.unit,
			targetUnit,
			itemTargetInfo.item
		);

		var value = Calculator.calculateRecoveryValue(
			targetUnit,
			recoveryInfo.getRecoveryValue(),
			recoveryInfo.getRecoveryType(),
			plus
		);

		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();

		if (itemTargetInfo.item.getRangeType() !== SelectionRangeType.SELFONLY)
		{
			generator.locationFocus(
				targetUnit.getMapX(),
				targetUnit.getMapY(),
				true
			);
		}

		if (itemTargetInfo.unit.getUnitType() !== targetUnit.getUnitType())
		{
			generator.damageHitEx(
				targetUnit,
				this._getItemRecoveryAnime(itemTargetInfo),
				value,
				DamageType.FIXED,
				100,
				itemTargetInfo.unit,
				itemUseParent.isItemSkipMode()
			);
		}
		else
		{
			generator.hpRecovery(
				targetUnit,
				this._getItemRecoveryAnime(itemTargetInfo),
				recoveryInfo.getRecoveryValue() + plus,
				recoveryInfo.getRecoveryType(),
				itemUseParent.isItemSkipMode()
			);
		}

		return this._dynamicEvent.executeDynamicEvent();
	},

	moveMainUseCycle: function()
	{
		return this._dynamicEvent.moveDynamicEvent();
	},

	_getItemRecoveryAnime: function(itemTargetInfo)
	{
		return validateNull(itemTargetInfo.item.getItemAnime());
	}
});
