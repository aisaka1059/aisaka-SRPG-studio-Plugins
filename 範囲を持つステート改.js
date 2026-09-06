/*--------------------------------------------------------------------------

注意：
このプラグインは名前未定（仮）さん制作の「範囲を持つステート」を改造したものになります
両方入れていると競合を起こすので入れる場合はどちらかにしてください
このプラグインを使用したことで問題が発生した場合には改造した私藍坂に連絡をください

概要：
杖によるステート付与にしか対応していなかった改造元をあらゆるステート付与に対応させたものになります

・拡散させる範囲（stateRange）
・拡散させる陣営（stateRangeFilter："PLAYER" "ENEMY" "ALLY"）
・移動後に範囲を再設定するかどうか（stateRangeMove）

をステートのカスタムパラメータに記載することで選択することができます

例えば「付与されたときに周囲5マスの味方と敵に拡散されて、移動先の周囲にも拡散するステート」を作りたいとしたら

{stateRange:5, stateRangeFilter:"PLAYER,ENEMY", stateRangeMove:true}

とステートのカスタムパラメータに書けばいいです

使用方法：
・これをメモ帳にコピペして拡張子を.jsにして保存するだけでいいです

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.324

更新履歴：
2026/09/02作成
2026/09/07
設定がfalseでも2度接近すると拡散されてしまう不具合を修正

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/


(function() {


	/*=======================================================================
	 *
	 * StateControl
	 *
	 *=======================================================================*/

	if (typeof StateControl !== 'undefined') {

		var aliasStateArrange =
			StateControl.arrangeState;


		StateControl._rangeStateCopying = false;
		StateControl._rangeStateBattle = false;
		StateControl._rangeStateClearing = false;
		StateControl._rangeStatePropagation = false;


		StateControl.arrangeState = function(
			unit,
			state,
			increaseType
		) {

			var result =
				aliasStateArrange.call(
					this,
					unit,
					state,
					increaseType
				);


			/*
			 * 通常のステート付与。
			 *
			 * 杖・道具の範囲指定は一切使用しない。
			 * state.custom.stateRange のみを見る。
			 */
			if (
				!this._rangeStateCopying &&
				!this._rangeStatePropagation &&
				increaseType === IncreaseType.INCREASE &&
				result !== null &&
				unit !== null &&
				state !== null
			) {

				RangeStateControl.prepareStateRange(
					unit,
					state
				);


				if (
					!this._rangeStateBattle
				) {

					RangeStateControl.clearRangeStateAll();
					RangeStateControl.upDateAndCopy();
				}
			}


			/*
			 * 中心ユニット自身のステートが解除された場合、
			 * その中心から拡散されたステートも解除する。
			 */
			if (
				!this._rangeStateCopying &&
				!this._rangeStateClearing &&
				increaseType === IncreaseType.DECREASE &&
				unit !== null &&
				state !== null &&
				!RangeStateControl._hasSourceState(
					unit,
					state.getId()
				)
			) {

				RangeStateControl.removeRangeStateBySource(
					unit,
					state.getId()
				);
			}


			return result;
		};
	}


	/*=======================================================================
	 *
	 * AttackFlow
	 *
	 *=======================================================================*/

	if (typeof AttackFlow !== 'undefined') {

		var aliasAttackStart =
			AttackFlow.startAttackFlow;

		AttackFlow.startAttackFlow =
			function() {

				StateControl._rangeStateBattle =
					true;

				return aliasAttackStart.call(this);
			};


		var aliasAttackMoveEndFlow =
			AttackFlow.moveEndFlow;

		AttackFlow.moveEndFlow =
			function() {

				var mode =
					this.getCycleMode();

				var result =
					aliasAttackMoveEndFlow.call(this);


				if (
					mode === AttackFlowMode.ENDFLOW &&
					this.getCycleMode() === AttackFlowMode.COMPLETE
				) {

					StateControl._rangeStateBattle =
						false;

					RangeStateControl.clearRangeStateAll();
					RangeStateControl.upDateAndCopy();
				}


				return result;
			};


		var aliasFinalizeAttack =
			AttackFlow.finalizeAttack;

		AttackFlow.finalizeAttack =
			function() {

				var result;

				StateControl._rangeStateBattle =
					true;

				result =
					aliasFinalizeAttack.call(this);

				StateControl._rangeStateBattle =
					false;

				RangeStateControl.clearRangeStateAll();
				RangeStateControl.upDateAndCopy();

				return result;
			};
	}


	/*=======================================================================
	 *
	 * UnitStateAdditionEventCommand
	 *
	 *=======================================================================*/

	if (
		typeof UnitStateAdditionEventCommand !== 'undefined'
	) {

		var aliasStateEvent =
			UnitStateAdditionEventCommand.mainEventCommand;

		UnitStateAdditionEventCommand.mainEventCommand =
			function() {

				aliasStateEvent.call(this);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * SimulateMove
	 *
	 *=======================================================================*/

	if (typeof SimulateMove !== 'undefined') {

		var aliasSimulateMoveStart =
			SimulateMove.startMove;

		SimulateMove.startMove =
			function(unit, moveCource) {

				RangeStateControl.clearRangeStateAll();

				aliasSimulateMoveStart.call(
					this,
					unit,
					moveCource
				);
			};


		var aliasSimulateMoveEnd =
			SimulateMove._endMove;

		SimulateMove._endMove =
			function(unit) {

				aliasSimulateMoveEnd.call(
					this,
					unit
				);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * PlayerTurn
	 *
	 *=======================================================================*/

	if (typeof PlayerTurn !== 'undefined') {

		var aliasPlayerTurn =
			PlayerTurn.setPosValue;

		PlayerTurn.setPosValue =
			function(unit) {

				RangeStateControl.clearRangeStateAll();

				aliasPlayerTurn.call(
					this,
					unit
				);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * TurnChangeStart
	 *
	 *=======================================================================*/

	if (
		typeof TurnChangeStart !== 'undefined' &&
		typeof TurnChangeStart._checkStateTurn !== 'undefined'
	) {

		var aliasTurnChange =
			TurnChangeStart._checkStateTurn;

		TurnChangeStart._checkStateTurn =
			function() {

				aliasTurnChange.call(this);

				RangeStateControl.clearRangeStateAll();
				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * StateTurnFlowEntry
	 *
	 *=======================================================================*/

	if (
		typeof StateTurnFlowEntry !== 'undefined' &&
		typeof StateTurnFlowEntry._checkStateTurn !== 'undefined'
	) {

		var aliasStateTurn =
			StateTurnFlowEntry._checkStateTurn;

		StateTurnFlowEntry._checkStateTurn =
			function() {

				aliasStateTurn.call(this);

				RangeStateControl.clearRangeStateAll();
				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * DamageHitEventCommand
	 *
	 *=======================================================================*/

	if (
		typeof DamageHitEventCommand !== 'undefined'
	) {

		var aliasDamageHit =
			DamageHitEventCommand._setDamage;

		DamageHitEventCommand._setDamage =
			function() {

				aliasDamageHit.call(this);

				if (
					this._targetUnit !== null &&
					this._targetUnit.getHp() <= 0
				) {

					RangeStateControl.clearRangeStateAll();
					RangeStateControl.upDateAndCopy();
				}
			};
	}


	/*=======================================================================
	 *
	 * DamageEraseFlowEntry
	 *
	 *=======================================================================*/

	if (
		typeof DamageEraseFlowEntry !== 'undefined'
	) {

		var aliasDamageErase =
			DamageEraseFlowEntry._doAction;

		DamageEraseFlowEntry._doAction =
			function(damageData) {

				aliasDamageErase.call(
					this,
					damageData
				);

				if (
					damageData !== null &&
					damageData.targetUnit !== null &&
					damageData.targetUnit.getHp() <= 0
				) {

					RangeStateControl.clearRangeStateAll();
					RangeStateControl.upDateAndCopy();
				}
			};
	}


	/*=======================================================================
	 *
	 * UnitDeathFlowEntry
	 *
	 *=======================================================================*/

	if (
		typeof UnitDeathFlowEntry !== 'undefined'
	) {

		var aliasUnitDeath =
			UnitDeathFlowEntry._doEndAction;

		UnitDeathFlowEntry._doEndAction =
			function() {

				aliasUnitDeath.call(this);

				RangeStateControl.clearRangeStateAll();
				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * LoserMessageFlowEntry
	 *
	 *=======================================================================*/

	if (
		typeof LoserMessageFlowEntry !== 'undefined'
	) {

		var aliasLoser =
			LoserMessageFlowEntry._completeMemberData;

		LoserMessageFlowEntry._completeMemberData =
			function(preAttack) {

				var result =
					aliasLoser.call(
						this,
						preAttack
					);

				RangeStateControl.clearRangeStateAll();
				RangeStateControl.upDateAndCopy();

				return result;
			};
	}


	/*=======================================================================
	 *
	 * CatchFusionAction
	 *
	 *=======================================================================*/

	if (
		typeof CatchFusionAction !== 'undefined'
	) {

		var aliasCatch =
			CatchFusionAction._doCatchAction;

		CatchFusionAction._doCatchAction =
			function() {

				RangeStateControl.clearRangeStateAll();
				RangeStateControl.upDateAndCopy();

				aliasCatch.call(this);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * ReleaseFusionAction
	 *
	 *=======================================================================*/

	if (
		typeof ReleaseFusionAction !== 'undefined'
	) {

		var aliasRelease =
			ReleaseFusionAction._doEndSlideAction;

		ReleaseFusionAction._doEndSlideAction =
			function() {

				var type =
					this._fusionData.getFusionReleaseType();

				aliasRelease.call(this);

				if (
					type !== FusionReleaseType.ERASE
				) {

					RangeStateControl.clearRangeStateAll();
					RangeStateControl.upDateAndCopy();
				}
			};
	}


	/*=======================================================================
	 *
	 * SlideObject
	 *
	 *=======================================================================*/

	if (typeof SlideObject !== 'undefined') {

		var aliasSlide =
			SlideObject.updateUnitPos;

		SlideObject.updateUnitPos =
			function() {

				RangeStateControl.clearRangeStateAll();

				aliasSlide.call(this);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * TeleportationItemUse
	 *
	 *=======================================================================*/

	if (
		typeof TeleportationItemUse !== 'undefined'
	) {

		var aliasTeleportEnter =
			TeleportationItemUse.enterMainUseCycle;

		TeleportationItemUse.enterMainUseCycle =
			function(itemUseParent) {

				RangeStateControl.clearRangeStateAll();

				return aliasTeleportEnter.call(
					this,
					itemUseParent
				);
			};


		var aliasTeleportAction =
			TeleportationItemUse.mainAction;

		TeleportationItemUse.mainAction =
			function() {

				aliasTeleportAction.call(this);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * RescueItemUse
	 *
	 *=======================================================================*/

	if (typeof RescueItemUse !== 'undefined') {

		var aliasRescueEnter =
			RescueItemUse.enterMainUseCycle;

		RescueItemUse.enterMainUseCycle =
			function(itemUseParent) {

				RangeStateControl.clearRangeStateAll();

				return aliasRescueEnter.call(
					this,
					itemUseParent
				);
			};


		var aliasRescueAction =
			RescueItemUse.mainAction;

		RescueItemUse.mainAction =
			function() {

				aliasRescueAction.call(this);

				RangeStateControl.upDateAndCopy();
			};
	}


	/*=======================================================================
	 *
	 * ScriptCall_Load
	 *
	 * セーブデータ読み込み後に範囲情報を再構築
	 *
	 *=======================================================================*/

	if (typeof ScriptCall_Load !== 'undefined') {

		var aliasScriptLoad =
			ScriptCall_Load.mainEventCommand;

		ScriptCall_Load.mainEventCommand =
			function() {

				aliasScriptLoad.call(this);

				RangeStateControl.upDateAll();
			};
	}


	/*=======================================================================
	 *
	 * ScriptCall_AppearEventUnit
	 *
	 *=======================================================================*/

	if (
		typeof ScriptCall_AppearEventUnit !== 'undefined'
	) {

		var aliasAppear =
			ScriptCall_AppearEventUnit.mainEventCommand;

		ScriptCall_AppearEventUnit.mainEventCommand =
			function() {

				aliasAppear.call(this);

				RangeStateControl.upDateAndCopy();
			};
	}

})();


/*=======================================================================
 *
 * RangeStateControl
 *
 *=======================================================================*/

var RangeStateControl = {


	_rangeStateUnitArray: [],


	/*===================================================================
	 *
	 * 更新
	 *
	 *===================================================================*/

	upDateAll: function() {

		this.clearRangeStateAll();
		this.upDate();
		this.copyRangeStateAll();
	},


	upDateAndCopy: function() {

		this.upDate();
		this.copyRangeStateAll();
	},


	upDate: function() {

		this._initList();

		this._addRangeStateUnitFromList(
			PlayerList.getSortieList()
		);

		this._addRangeStateUnitFromList(
			EnemyList.getAliveList()
		);

		this._addRangeStateUnitFromList(
			AllyList.getAliveList()
		);
	},


	/*===================================================================
	 *
	 * 中心ステート確認
	 *
	 *===================================================================*/

	_hasSourceState: function(unit, stateId) {

		var list;
		var count;
		var i;
		var turnState;


		if (unit == null) {
			return false;
		}


		list =
			unit.getTurnStateList();

		count =
			list.getCount();


		for (
			i = 0;
			i < count;
			i++
		) {

			turnState =
				list.getData(i);


			if (
				turnState.getState().getId() ==
				stateId
			) {

				return true;
			}
		}


		return false;
	},


	/*===================================================================
	 *
	 * 範囲ステート削除
	 *
	 *===================================================================*/

	clearRangeStateAll: function() {

		var i;
		var j;
		var arrayCnt;
		var unit;
		var indexArray;
		var stateRangeDataArray;
		var stateRangeData;


		var rangeStateUnitCnt =
			this._rangeStateUnitArray.length;


		var oldClearing =
			StateControl._rangeStateClearing;

		StateControl._rangeStateClearing =
			true;


		for (
			i = 0;
			i < rangeStateUnitCnt;
			i++
		) {

			unit =
				this._getUnitFromId(
					this._rangeStateUnitArray[i].getId()
				);


			if (unit == null) {
				continue;
			}


			stateRangeDataArray =
				this._getStateRangeDataArray(unit);

			arrayCnt =
				stateRangeDataArray.length;


			for (
				j = 0;
				j < arrayCnt;
				j++
			) {

				stateRangeData =
					stateRangeDataArray[j];


				/*
				 * 中心ステートが解除されていたら
				 * 拡散情報そのものを削除する。
				 */
				if (
					!this._hasSourceState(
						unit,
						stateRangeData.stateId
					)
				) {

					this.removeRangeStateBySource(
						unit,
						stateRangeData.stateId
					);


					stateRangeDataArray.splice(
						j,
						1
					);

					arrayCnt--;
					j--;

					continue;
				}


				/*
				 * falseなら移動による再計算をしない。
				 */
				if (
					stateRangeData.stateRangeMove === false
				) {

					continue;
				}


				indexArray =
					IndexArray.getBestIndexArray(
						unit.getMapX(),
						unit.getMapY(),
						1,
						stateRangeData.stateRange
					);


				this.clearRangeStateFromIndexArray(
					stateRangeData,
					indexArray
				);
			}
		}


		StateControl._rangeStateClearing =
			oldClearing;
	},


	clearRangeStateFromIndexArray: function(
		stateRangeData,
		indexArray
	) {

		var i;
		var index;
		var x;
		var y;
		var targetUnit;
		var state;


		var count =
			indexArray.length;


		var stateRangeFilter =
			stateRangeData.stateRangeFilter;


		state =
			this.getChildState(
				stateRangeData
			);


		if (state == null) {
			return;
		}


		for (
			i = 0;
			i < count;
			i++
		) {

			index =
				indexArray[i];

			x =
				CurrentMap.getX(index);

			y =
				CurrentMap.getY(index);


			targetUnit =
				PosChecker.getUnitFromPos(
					x,
					y
				);


			if (targetUnit !== null) {

				if (
					this._checkFilter(
						targetUnit,
						stateRangeFilter
					)
				) {

					if (
						!this._hasSameRangeState(
							targetUnit,
							stateRangeData
						)
					) {

						StateControl.arrangeState(
							targetUnit,
							state,
							IncreaseType.DECREASE
						);
					}
				}
			}
		}
	},


	/*===================================================================
	 *
	 * 範囲ステートコピー
	 *
	 *===================================================================*/

	copyRangeStateAll: function() {

		var i;
		var j;
		var arrayCnt;
		var unit;
		var indexArray;
		var stateRangeDataArray;
		var stateRangeData;


		var rangeStateUnitCnt =
			this._rangeStateUnitArray.length;


		var oldCopying =
			StateControl._rangeStateCopying;

		StateControl._rangeStateCopying =
			true;


		for (
			i = 0;
			i < rangeStateUnitCnt;
			i++
		) {

			unit =
				this._getUnitFromId(
					this._rangeStateUnitArray[i].getId()
				);


			if (unit == null) {
				continue;
			}


			if (
				FusionControl.getFusionParent(unit)
			) {
				continue;
			}


			if (
				unit.isInvisible()
			) {
				continue;
			}


			stateRangeDataArray =
				this._getStateRangeDataArray(unit);

			arrayCnt =
				stateRangeDataArray.length;


			for (
				j = 0;
				j < arrayCnt;
				j++
			) {

				stateRangeData =
					stateRangeDataArray[j];


				/*
				 * 中心ステートが解除済みなら
				 * この拡散機能を完全に破棄する。
				 */
				if (
					!this._hasSourceState(
						unit,
						stateRangeData.stateId
					)
				) {

					this.removeRangeStateBySource(
						unit,
						stateRangeData.stateId
					);


					stateRangeDataArray.splice(
						j,
						1
					);

					arrayCnt--;
					j--;

					continue;
				}


				/*
				 * falseかつ一度拡散済みなら
				 * 新しい位置には拡散しない。
				 */
				if (
					stateRangeData.stateRangeMove === false &&
					stateRangeData.stateRangeInitialized === true
				) {

					continue;
				}


				indexArray =
					IndexArray.getBestIndexArray(
						unit.getMapX(),
						unit.getMapY(),
						1,
						stateRangeData.stateRange
					);


				this.copyRangeStateFromIndexArray(
					stateRangeData,
					indexArray
				);


				if (
					stateRangeData.stateRangeMove === false
				) {

					stateRangeData.stateRangeInitialized =
						true;
				}
			}
		}


		StateControl._rangeStateCopying =
			oldCopying;
	},


	copyRangeStateFromIndexArray: function(
		stateRangeData,
		indexArray
	) {

		var i;
		var index;
		var x;
		var y;
		var targetUnit;
		var state;
		var oldPropagation;
		var result;


		var count =
			indexArray.length;


		var stateRangeFilter =
			stateRangeData.stateRangeFilter;


		state =
			this.getChildState(
				stateRangeData
			);


		if (state == null) {
			return;
		}


		for (
			i = 0;
			i < count;
			i++
		) {

			index =
				indexArray[i];

			x =
				CurrentMap.getX(index);

			y =
				CurrentMap.getY(index);


			targetUnit =
				PosChecker.getUnitFromPos(
					x,
					y
				);


			if (targetUnit !== null) {

				if (
					this._checkFilter(
						targetUnit,
						stateRangeFilter
					)
				) {

					if (
						!this._hasSameRangeState(
							targetUnit,
							stateRangeData
						)
					) {

						if (
							StateControl.isStateBlocked(
								targetUnit,
								null,
								state
							)
						) {

							continue;
						}


						/*
						 * 拡散されたステートが
						 * 新しい中心になるのを防止。
						 */
						oldPropagation =
							StateControl._rangeStatePropagation;

						StateControl._rangeStatePropagation =
							true;


						result =
							StateControl.arrangeState(
								targetUnit,
								state,
								IncreaseType.INCREASE
							);


						StateControl._rangeStatePropagation =
							oldPropagation;


						if (
							result !== null
						) {

							this._registerRangeStateTarget(
								targetUnit,
								stateRangeData,
								state.getId()
							);


							this._setStateTurn(
								targetUnit,
								state,
								stateRangeData.stateTurn
							);
						}
					}
				}
			}
		}
	},


	/*===================================================================
	 *
	 * 拡散されたステートの追跡
	 *
	 *===================================================================*/

	_registerRangeStateTarget: function(
		targetUnit,
		stateRangeData,
		targetStateId
	) {

		var array;
		var i;
		var obj;


		if (
			targetUnit == null ||
			stateRangeData == null
		) {

			return;
		}


		if (
			typeof targetUnit.custom.rangeStateSourceArray
			=== 'undefined'
		) {

			targetUnit.custom.rangeStateSourceArray =
				[];
		}


		array =
			targetUnit.custom.rangeStateSourceArray;


		for (
			i = 0;
			i < array.length;
			i++
		) {

			if (
				array[i].sourceUnitId ===
				stateRangeData.sourceUnitId &&
				array[i].sourceStateId ===
				stateRangeData.stateId &&
				array[i].targetStateId ===
				targetStateId
			) {

				return;
			}
		}


		obj = {};

		obj.sourceUnitId =
			stateRangeData.sourceUnitId;

		obj.sourceStateId =
			stateRangeData.stateId;

		obj.targetStateId =
			targetStateId;


		array.push(obj);
	},


	removeRangeStateBySource: function(
		sourceUnit,
		sourceStateId
	) {

		var lists;
		var i;
		var j;
		var k;
		var unit;
		var array;
		var data;
		var state;
		var oldClearing;


		if (
			sourceUnit == null
		) {

			return;
		}


		lists = [
			PlayerList.getSortieList(),
			EnemyList.getAliveList(),
			AllyList.getAliveList()
		];


		oldClearing =
			StateControl._rangeStateClearing;

		StateControl._rangeStateClearing =
			true;


		for (
			i = 0;
			i < lists.length;
			i++
		) {

			if (
				lists[i] == null
			) {

				continue;
			}


			for (
				j = 0;
				j < lists[i].getCount();
				j++
			) {

				unit =
					lists[i].getData(j);


				if (
					unit == null ||
					typeof unit.custom.rangeStateSourceArray
					=== 'undefined'
				) {

					continue;
				}


				array =
					unit.custom.rangeStateSourceArray;


				for (
					k = array.length - 1;
					k >= 0;
					k--
				) {

					data =
						array[k];


					if (
						data.sourceUnitId ===
						sourceUnit.getId() &&
						data.sourceStateId ===
						sourceStateId
					) {

						state =
							this.getStateFromId(
								data.targetStateId
							);


						if (
							state != null &&
							this._hasSourceState(
								unit,
								data.targetStateId
							)
						) {

							StateControl.arrangeState(
								unit,
								state,
								IncreaseType.DECREASE
							);
						}


						array.splice(
							k,
							1
						);
					}
				}


				if (
					array.length === 0
				) {

					delete unit.custom.rangeStateSourceArray;
				}
			}
		}


		StateControl._rangeStateClearing =
			oldClearing;
	},


	/*===================================================================
	 *
	 * 範囲ステート情報作成
	 *
	 *===================================================================*/

	prepareStateRange: function(
		unit,
		state
	) {

		var range;
		var filter;


		if (
			unit == null ||
			state == null
		) {

			return false;
		}


		/*
		 * このプラグインでは
		 * state.custom.stateRange のみを使用。
		 *
		 * 杖・アイテムのcustom.stateRangeは見ない。
		 */
		if (
			typeof state.custom.stateRange !== 'number'
		) {

			return false;
		}


		range =
			state.custom.stateRange;


		if (
			range < 1
		) {

			return false;
		}


		filter =
			this._getStateRangeFilter(
				state
			);


		unit.custom.stateRange =
			range;

		unit.custom.stateRangeFilter =
			filter;


		this.createRangeData(
			unit,
			state
		);


		return true;
	},


	/*===================================================================
	 *
	 * stateRangeFilter
	 *
	 *===================================================================*/

	_getStateRangeFilter: function(state) {

		var value;
		var result;


		value =
			state.custom.stateRangeFilter;


		if (
			typeof value === 'number'
		) {

			return value;
		}


		if (
			typeof value !== 'string'
		) {

			return (
				UnitFilterFlag.PLAYER |
				UnitFilterFlag.ENEMY |
				UnitFilterFlag.ALLY
			);
		}


		result =
			this._getFilterFromString(
				value
			);


		if (
			result === 0
		) {

			result =
				UnitFilterFlag.PLAYER |
				UnitFilterFlag.ENEMY |
				UnitFilterFlag.ALLY;
		}


		return result;
	},


	_getFilterFromString: function(value) {

		var result = 0;
		var array;
		var i;
		var text;


		array =
			value.toUpperCase().split(',');


		for (
			i = 0;
			i < array.length;
			i++
		) {

			text =
				this._trimString(
					array[i]
				);


			if (
				text === 'PLAYER'
			) {

				result |=
					UnitFilterFlag.PLAYER;
			}
			else if (
				text === 'ENEMY'
			) {

				result |=
					UnitFilterFlag.ENEMY;
			}
			else if (
				text === 'ALLY'
			) {

				result |=
					UnitFilterFlag.ALLY;
			}
		}


		return result;
	},


	_trimString: function(text) {

		var start = 0;
		var end =
			text.length - 1;


		while (
			start <= end &&
			(
				text.charAt(start) === ' ' ||
				text.charAt(start) === '\t'
			)
		) {

			start++;
		}


		while (
			end >= start &&
			(
				text.charAt(end) === ' ' ||
				text.charAt(end) === '\t'
			)
		) {

			end--;
		}


		if (
			start > end
		) {

			return '';
		}


		return text.substring(
			start,
			end + 1
		);
	},


	/*===================================================================
	 *
	 * 範囲ステート情報
	 *
	 *===================================================================*/

	createRangeData: function(
		unit,
		state
	) {

		var obj;
		var oldArray;
		var oldData;
		var oldInitialized = false;


		if (
			unit == null ||
			state == null
		) {

			return;
		}


		/*
		 * 同じ中心ユニット・同じステートが再付与/更新された場合でも、
		 * stateRangeMove:false の「一度だけ拡散済み」という情報を
		 * リセットしない。
		 *
		 * これをリセットしてしまうと、
		 *
		 *  1. 一度範囲内に入る
		 *  2. 行動をキャンセルする
		 *  3. 再び範囲内に入る
		 *
		 * という流れで、同じ中心ステートから再度拡散してしまう。
		 */
		oldArray =
			this._getStateRangeDataArray(unit);


		if (
			oldArray != null
		) {

			var oldCount =
				oldArray.length;

			var oldId =
				state.getId();

			var i;


			for (
				i = 0;
				i < oldCount;
				i++
			) {

				oldData =
					oldArray[i];

				if (
					oldData != null &&
					oldData.stateId === oldId
				) {

					oldInitialized =
						oldData.stateRangeInitialized === true;

					break;
				}
			}
		}


		obj = {};


		obj.stateId =
			state.getId();


		obj.sourceUnitId =
			unit.getId();


		obj.stateTurn =
			state.getTurn();


		obj.stateRange =
			unit.custom.stateRange;


		obj.stateRangeFilter =
			unit.custom.stateRangeFilter;


		obj.stateRangeMove =
			true;


		if (
			typeof state.custom.stateRangeMove
			=== 'boolean'
		) {

			obj.stateRangeMove =
				state.custom.stateRangeMove;
		}


		/*
		 * 既に一度拡散済みなら、その状態を維持する。
		 * これにより false のステートは、中心ステートが
		 * 解除されるまで再拡散しない。
		 */
		obj.stateRangeInitialized =
			oldInitialized;


		if (
			typeof state.custom.aroundStateId
			!== 'undefined'
		) {

			obj.aroundStateId =
				state.custom.aroundStateId;
		}


		this._updateSameRangeState(
			unit,
			obj
		);
	},


	getStateFromId: function(stateId) {

		var list =
			root.getBaseData().getStateList();


		return list.getDataFromId(
			stateId
		);
	},


	getChildState: function(
		stateRangeData
	) {

		if (
			typeof stateRangeData.aroundStateId
			!== 'undefined'
		) {

			return this.getStateFromId(
				stateRangeData.aroundStateId
			);
		}


		return this.getStateFromId(
			stateRangeData.stateId
		);
	},


	isStateRangeUnit: function(unit) {

		if (
			unit == null
		) {

			return false;
		}


		if (
			typeof unit.custom.stateRangeDataArray
			=== 'undefined'
		) {

			return false;
		}


		return (
			unit.custom.stateRangeDataArray.length > 0
		);
	},


	_updateSameRangeState: function(
		unit,
		obj
	) {

		var array =
			this._getStateRangeDataArray(unit);

		var i;


		for (
			i = 0;
			i < array.length;
			i++
		) {

			if (
				array[i].stateId ===
				obj.stateId
			) {

				array[i] =
					obj;

				unit.custom.stateRangeDataArray =
					array;

				return;
			}
		}


		array.push(obj);


		unit.custom.stateRangeDataArray =
			array;
	},


	_getStateRangeDataArray: function(unit) {

		if (
			unit != null &&
			typeof unit.custom.stateRangeDataArray
			!== 'undefined'
		) {

			return unit.custom.stateRangeDataArray;
		}


		return [];
	},


	_setStateTurn: function(
		unit,
		state,
		turn
	) {

		var list =
			unit.getTurnStateList();

		var i;
		var turnState;


		for (
			i = 0;
			i < list.getCount();
			i++
		) {

			turnState =
				list.getData(i);


			if (
				turnState.getState().getId()
				===
				state.getId()
			) {

				turnState.setTurn(turn);

				return;
			}
		}
	},


	_hasSameRangeState: function(
		unit,
		stateRangeData
	) {

		var array =
			this._getStateRangeDataArray(unit);

		var i;


		for (
			i = 0;
			i < array.length;
			i++
		) {

			if (
				array[i].stateId
				===
				stateRangeData.stateId
			) {

				return true;
			}
		}


		return false;
	},


	/*===================================================================
	 *
	 * 所属判定
	 *
	 *===================================================================*/

	_checkFilter: function(
		unit,
		filter
	) {

		var type;


		if (
			unit == null
		) {

			return false;
		}


		type =
			unit.getUnitType();


		if (
			(filter & UnitFilterFlag.PLAYER) &&
			type === UnitType.PLAYER
		) {

			return true;
		}


		if (
			(filter & UnitFilterFlag.ENEMY) &&
			type === UnitType.ENEMY
		) {

			return true;
		}


		if (
			(filter & UnitFilterFlag.ALLY) &&
			type === UnitType.ALLY
		) {

			return true;
		}


		return false;
	},


	/*===================================================================
	 *
	 * 登録ユニット
	 *
	 *===================================================================*/

	_initList: function() {

		this._rangeStateUnitArray =
			[];
	},


	_addRangeStateUnitFromList: function(list) {

		var i;
		var unit;


		if (
			list == null
		) {

			return;
		}


		for (
			i = 0;
			i < list.getCount();
			i++
		) {

			unit =
				list.getData(i);


			if (
				this.isStateRangeUnit(unit)
			) {

				this._rangeStateUnitArray.push(
					unit
				);
			}
		}
	},


	/*===================================================================
	 *
	 * IDからユニット取得
	 *
	 *===================================================================*/

	_getUnitFromId: function(unitid) {

		var unitlist;
		var unit;
		var index;
		var i;


		if (
			unitid < 65536 ||
			unitid >= 393216
		) {

			index = 0;
		}
		else if (
			(
				unitid >= 65536 &&
				unitid < 196608
			)
			||
			(
				unitid >= 327680 &&
				unitid < 393216
			)
		) {

			index = 1;
		}
		else {

			index = 2;
		}


		for (
			i = 0;
			i < 3;
			i++
		) {

			if (
				index === 0
			) {

				unitlist =
					PlayerList.getMainList();
			}
			else if (
				index === 1
			) {

				unitlist =
					root.getCurrentSession()
					.getEnemyList();
			}
			else {

				unitlist =
					root.getCurrentSession()
					.getAllyList();
			}


			if (
				unitlist != null
			) {

				unit =
					unitlist.getDataFromId(
						unitid
					);


				if (
					unit != null
				) {

					return unit;
				}
			}


			index++;


			if (
				index >= 3
			) {

				index = 0;
			}
		}


		return null;
	}

};
