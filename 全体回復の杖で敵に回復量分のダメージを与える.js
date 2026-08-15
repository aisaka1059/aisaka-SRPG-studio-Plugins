/*--------------------------------------------------------------------------

概要：
・このプラグインを入れていると全体回復の杖が味方には回復、敵には回復量分のダメージを与える杖になります
・全回復の場合はユニットの最大HP分のダメージを与えます（要するに即死攻撃）
・敵に持たせた場合ゲームバランスには気を付けてください
・単体回復には対応していないので別途作成したプラグインを入れてください

・注意点として、もともと回復時に敵のみを選別して撃破処理など考慮されていないのでアニメーションが無いです。使用時のアニメにエフェクトを設定して誤魔化してください

使用方法：
・これをメモ帳にコピペして拡張子を.jsにして保存するだけでいいです

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.324

更新履歴：
2026/08/16　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/
var EntireRecoveryItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	
	enterMainUseCycle: function(itemUseParent, animeData) {
		this._itemUseParent = itemUseParent;
		
		this.mainAction();
		
		return EnterResult.OK;
	},
	
	mainAction: function() {
		var i, targetUnit;
		var info = this._itemUseParent.getItemTargetInfo();
		var arr = EntireRecoveryControl.getTargetArray(info.unit, info.item);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			targetUnit = arr[i];
			this._recoveryHp(targetUnit);
		}
		
		return false;
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		var size = Miscellaneous.getFirstKeySpriteSize(animeData, 0);
		var x = LayoutControl.getCenterX(-1, size.width);
		var y = LayoutControl.getCenterY(-1, size.height) - 20;
		
		return createPos(x, y);
	},
	
	validateItem: function(itemTargetInfo) {
		return true;
	},
	
	_recoveryHp: function(unit) {
	var hp = unit.getHp();
	var value = this._getValue(unit);
	var maxMhp = ParamBonus.getMhp(unit);
	var info = this._itemUseParent.getItemTargetInfo();
	
	// 敵を対象にした場合
	if (info.unit.getUnitType() !== unit.getUnitType()) {
		hp -= value;
		
		if (hp <= 0) {
			unit.setHp(0);
			
			// HPが0になったので死亡・負傷状態にする
			DamageControl.setDeathState(unit);
		}
		else {
			unit.setHp(hp);
		}
	}
	// 味方を対象にした場合
	else {
		hp += value;
		
		if (hp > maxMhp) {
			hp = maxMhp;
		}
		
		unit.setHp(hp);
	}
},
	
	_getValue: function(targetUnit) {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var plus = Calculator.calculateRecoveryItemPlus(
			itemTargetInfo.unit,
			targetUnit,
			itemTargetInfo.item
		);
		var recoveryInfo = itemTargetInfo.item.getEntireRecoveryInfo();
		
		return Calculator.calculateRecoveryValue(
			targetUnit,
			recoveryInfo.getRecoveryValue(),
			recoveryInfo.getRecoveryType(),
			plus
		);
	}
}
);
