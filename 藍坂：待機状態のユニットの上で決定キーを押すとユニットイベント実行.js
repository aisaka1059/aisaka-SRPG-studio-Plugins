/*--------------------------------------------------------------------------

概要：
・ユニットイベントのカスタムパラメータに taiki と書かれている場合、待機しているユニットの上で決定キーを押すとそのユニットイベントが表示されます

使用方法：
・表示したいユニットイベントのカスタムパラメータに {taiki:true} と書いてください。
・デフォルトでは待機時のイベントはユニットイベントか「待機」コマンドしか表示されません。
・待機状態で「攻撃」をしたい場合

groupArray.appendObject(UnitCommand.Attack);

をif文の中から外してください。他のコマンドも同様にして待機状態で行うことが可能になります。
・ただし待機状態で攻撃可能にすると無限攻撃ができてしまう等、使い方によってはゲームバランスを著しく歪める可能性があります。

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.310

更新履歴：
2025/03/25　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

(function () {

	PlayerTurn._moveMap = function () {

		var result = this._mapEdit.moveMapEdit();

		if (result === MapEditResult.UNITSELECT) {
			this._targetUnit = this._mapEdit.getEditTarget();
			if (this._targetUnit !== null) {
				if (this._targetUnit.isWait()) {
					this._mapEdit.clearRange();

					// 待機しているユニット上での決定キー押下は、ユニットコマンドとして扱う
					this._mapSequenceCommand.openSequence(this);
					this.changeCycleMode(PlayerTurnMode.UNITCOMMAND);
				}
				else {
					// ユニットの移動範囲を表示するモードに進む
					this._mapSequenceArea.openSequence(this);
					this.changeCycleMode(PlayerTurnMode.AREA);
				}
			}
		}
		else if (result === MapEditResult.MAPCHIPSELECT) {
			this._mapCommandManager.openListCommandManager();
			this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
		}

		return MoveResult.CONTINUE;
	};

	UnitCommand.configureCommands = function (groupArray) {

		var unit = this.getListCommandUnit();

		if (!unit.isWait()) {
			this._appendTalkEvent(groupArray);
			groupArray.appendObject(UnitCommand.Attack);
			groupArray.appendObject(UnitCommand.PlaceCommand);
			groupArray.appendObject(UnitCommand.Occupation);
			groupArray.appendObject(UnitCommand.Treasure);
			groupArray.appendObject(UnitCommand.Village);
			groupArray.appendObject(UnitCommand.Shop);
			groupArray.appendObject(UnitCommand.Gate);
		}
		this._appendUnitEvent(groupArray);
		if (!unit.isWait()) {
			groupArray.appendObject(UnitCommand.Quick);
			groupArray.appendObject(UnitCommand.Steal);
			groupArray.appendObject(UnitCommand.Wand);
			groupArray.appendObject(UnitCommand.Information);
			this._appendMetamorphozeCommand(groupArray);
			this._appendFusionCommand(groupArray);
			groupArray.appendObject(UnitCommand.Item);
			groupArray.appendObject(UnitCommand.Trade);
			groupArray.appendObject(UnitCommand.Stock);
			groupArray.appendObject(UnitCommand.MetamorphozeCancel);
		}
		groupArray.appendObject(UnitCommand.Wait);
	};

	UnitCommand._appendUnitEvent = function (groupArray) {
		var i, event, info;
		var unit = this.getListCommandUnit();
		var count = unit.getUnitEventCount();

		for (i = 0; i < count; i++) {
			event = unit.getUnitEvent(i);
			info = event.getUnitEventInfo();
			if (unit.isWait() && event.custom.taiki) {
				groupArray.appendObject(UnitCommand.UnitEvent);
				groupArray[groupArray.length - 1].setEvent(event);
			}
			else if (!unit.isWait() && !event.custom.taiki && info.getUnitEventType() === UnitEventType.COMMAND && event.isEvent()) {
				groupArray.appendObject(UnitCommand.UnitEvent);
				groupArray[groupArray.length - 1].setEvent(event);
			}
		}
	};

	MapSequenceCommand._doLastAction = function () {
		var i;
		var unit = null;
		var list = PlayerList.getSortieList();
		var count = list.getCount();

		// コマンドの実行によってユニットが存在しなくなる可能性も考えられるため確認
		for (i = 0; i < count; i++) {
			if (this._targetUnit === list.getData(i)) {
				unit = this._targetUnit;
				break;
			}
		}

		// ユニットが死亡などしておらず、依然として存在するか調べる
		if (unit !== null) {
			if (this._unitCommandManager.getExitCommand() !== null) {
				if (!this._unitCommandManager.isRepeatMovable()) {
					// 再移動が許可されていない場合は、再移動が発生しないようにする
					this._targetUnit.setMostResentMov(ParamBonus.getMov(this._targetUnit));
				}

				// ユニットは何らかの行動をしたため、待機状態にする
				this._parentTurnObject.recordPlayerAction(true);
				return 0;
			}
			else if (!unit.isWait()) {
				// ユニットは行動しなかったため、位置とカーソルを戻す
				this._parentTurnObject.setPosValue(unit);
			}

			// 向きを正面にする
			unit.setDirection(DirectionType.NULL);
		}
		else {
			this._parentTurnObject.recordPlayerAction(true);
			return 1;
		}

		return 2;
	};

})();
