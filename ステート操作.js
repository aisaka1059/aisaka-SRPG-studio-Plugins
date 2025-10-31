/*--------------------------------------------------------------------------

※注意※

私が作成した
ステート解除時に別のステート付与.js
または
ステートのターン数を増減させるプラグイン
を導入している人はそれらを抜いてこれ1つだけ入れてください。競合を起こしてエラーを吐きます


概要：
・ステートのターン増減
・ステートの現在ターンをn倍にする
・ステート解除時に別のステート付与
・バッドステート予防ステート（新規効果）

の3つを扱うことができます

使用方法：
▼ターン増減
 コード実行に

 Fnc_ChangeStateTurn._StateTurnControl(1, 5, false, true, true, false);
 のように書いてください

 ()の中身は順に　増減したいステートのid, 増減させたいターン(正の値なら増加、負の値なら減少), オリジナルデータのユニットのみ対象, プレイヤーユニット全員, エネミーユニット全員, 同盟ユニット全員　です
 例だと、プレイヤーユニットとエネミーユニット全員のid1のステートが5ターン延長されます

▼ターンn倍
 コード実行に

 Fnc_ChangeStateTurn._MultiplyStateTurn(5, 2, true, false, false, false);

 のように書いてください
 例だと、オリジナルデータで選択したユニットのみid5のステートが2倍になります

▼解除時付与
 解除対象ステートのカスタムパラメータに

 { assignment: [1, 2, 3] }

 のように書いてください。例だと何らかのステートが解除されたときに1,2,3のステートが付与されます

▼バッドステート予防
 ステートのカスタムパラメータに

 { preventBadState: true, preventTurn: 3 }

 のように書いてください。防げる回数はpreventTurn: 3の部分をいじれば変えられます
 作者の想定では、予防ステートの残りターンがバッドステートを防げる回数を表しています
 SRPGSTUDIO本体で予防ステートの持続ターンを何ターンに設定していようとこちらが優先されます
 ターン開始時に残りターンは減少してしまいますが、上のステートのターン増減機能でターン開始時に+1してあげれば実質的にターンは減ってないものとみなせます
 ステートでプレイヤーが確認できる数字がそれしかなかったので苦肉の策です

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.313

更新履歴：
2025/10/31　作成

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

(function () {

	//-------------------------------------------------------
	// ステートターン増減関数
	//-------------------------------------------------------
	var Fnc_ChangeStateTurn = {
		_StateTurnControl: function (Id, turn, one, player, enemy, ally) {
			if (one === true) {
				var content = root.getEventCommandObject().getOriginalContent();
				var unit = content.getUnit();
				var list = unit.getTurnStateList();
				var count = list.getCount();
				this._modifyTurnState(Id, turn, unit, list, count);
			}

			if (player === true) {
				var playerList = PlayerList.getAliveList();
				this._getStateList(Id, turn, playerList, playerList.getCount());
			}
			if (enemy === true) {
				var enemyList = EnemyList.getAliveList();
				this._getStateList(Id, turn, enemyList, enemyList.getCount());
			}
			if (ally === true) {
				var allyList = AllyList.getAliveList();
				this._getStateList(Id, turn, allyList, allyList.getCount());
			}
		},

		_getStateList: function (Id, turn, unitList, unitCount) {
			var i;
			for (i = 0; i < unitCount; i++) {
				var unit = unitList.getData(i);
				var stateList = unit.getTurnStateList();
				var stateCount = stateList.getCount();
				this._modifyTurnState(Id, turn, unit, stateList, stateCount);
			}
		},

		_modifyTurnState: function (Id, turn, unit, list, count) {
			var i;
			for (i = 0; i < count; i++) {
				var turnstate = list.getData(i);
				var state = turnstate.getState();
				var changeturn = turnstate.getTurn();

				if (state.getId() === Id) {
					changeturn += turn;
					if (changeturn <= 0) {
						StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
					} else {
						turnstate.setTurn(changeturn);
					}
					break;
				}
			}
		}
	};


	//-------------------------------------------------------
	// ステート付与・解除処理 + バッドステート予防
	//-------------------------------------------------------
	var _arrangeState = StateControl.arrangeState;
	StateControl.arrangeState = function (unit, state, increaseType) {
		var turnState = null;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		var editor = root.getDataEditor();

		//---------------------------------------------------
		// バッドステート予防チェック
		//---------------------------------------------------
		if (increaseType === IncreaseType.INCREASE && state.isBadState()) {
			var i, j;
			for (i = 0; i < count; i++) {
				var ts = list.getData(i);
				var s = ts.getState();

				// preventBadStateを持つステートがあるか？
				if (s.custom.preventBadState === true) {
					// 既に同じステートがある場合は防がない
					var alreadyHas = false;
					for (j = 0; j < count; j++) {
						var existing = list.getData(j).getState();
						if (existing.getId() === state.getId()) {
							alreadyHas = true;
							break;
						}
					}

					// 既存がないときだけ防ぐ
					if (!alreadyHas) {
						root.log("バッドステート「" + state.getName() + "」は予防ステートにより無効化されました");

						// 予防ステートのターンを1減少
						var remain = ts.getTurn();
						if (remain > 1) {
							ts.setTurn(remain - 1);
						} else {
							StateControl.arrangeState(unit, s, IncreaseType.DECREASE);
						}
						return null;
					}
				}
			}
		}

		//---------------------------------------------------
		// 通常付与・解除処理
		//---------------------------------------------------
		if (increaseType === IncreaseType.INCREASE) {
			turnState = this.getTurnState(unit, state);
			if (turnState !== null) {
				turnState.setTurn(state.getTurn());
			} else if (count < DataConfig.getMaxStateCount()) {
				turnState = editor.addTurnStateData(list, state);
			}

			// preventTurnが指定されている場合は上書き
			if (state.custom.preventBadState === true && typeof state.custom.preventTurn === 'number') {
				if (turnState) {
					turnState.setTurn(state.custom.preventTurn);
				}
			}
		}
		else if (increaseType === IncreaseType.DECREASE) {
			editor.deleteTurnStateData(list, state);

			// ステート解除時に別ステート付与
			if (state.custom.assignment) {
				var stateList = root.getBaseData().getStateList();
				var ids, k;
				if (state.custom.assignment instanceof Array) {
					ids = state.custom.assignment;
				} else {
					ids = [state.custom.assignment];
				}

				for (k = 0; k < ids.length; k++) {
					var id = ids[k];
					var newState = stateList.getDataFromId(id);
					if (newState) {
						StateControl.arrangeState(unit, newState, IncreaseType.INCREASE);
					}
				}
			}
		}
		else if (increaseType === IncreaseType.ALLRELEASE) {
			editor.deleteAllTurnStateData(list);
		}

		MapHpControl.updateHp(unit);
		return turnState;
	};


	//-------------------------------------------------------
	// 自動解除時にもassignment付与を適用
	//-------------------------------------------------------
	var _removeState = StateAutoRemovalFlowEntry._removeState;
	StateAutoRemovalFlowEntry._removeState = function (list, turnState, unit) {
		var count = turnState.getRemovalCount() - 1;
		if (count > 0) {
			turnState.setRemovalCount(count);
			return;
		}

		root.getDataEditor().deleteTurnStateData(list, turnState.getState());
		var state = turnState.getState();

		if (state.custom.assignment) {
			var stateList = root.getBaseData().getStateList();
			var ids, i;
			if (state.custom.assignment instanceof Array) {
				ids = state.custom.assignment;
			} else {
				ids = [state.custom.assignment];
			}

			for (i = 0; i < ids.length; i++) {
				var id = ids[i];
				var newState = stateList.getDataFromId(id);
				if (newState) {
					StateControl.arrangeState(unit, newState, IncreaseType.INCREASE);
				}
			}
		}
	};

	// -------------------------------------------------------
	// ステート残りターン倍率変更関数
	// -------------------------------------------------------
	Fnc_ChangeStateTurn._MultiplyStateTurn = function (Id, rate, one, player, enemy, ally) {
		if (rate <= 0) return; // 無効な倍率は無視

		if (one === true) {
			var content = root.getEventCommandObject().getOriginalContent();
			var unit = content.getUnit();
			var list = unit.getTurnStateList();
			this._applyMultiply(Id, rate, unit, list);
		}

		if (player === true) {
			var playerList = PlayerList.getAliveList();
			for (var i = 0; i < playerList.getCount(); i++) {
				var unit = playerList.getData(i);
				var list = unit.getTurnStateList();
				this._applyMultiply(Id, rate, unit, list);
			}
		}

		if (enemy === true) {
			var enemyList = EnemyList.getAliveList();
			for (var j = 0; j < enemyList.getCount(); j++) {
				var unit = enemyList.getData(j);
				var list = unit.getTurnStateList();
				this._applyMultiply(Id, rate, unit, list);
			}
		}

		if (ally === true) {
			var allyList = AllyList.getAliveList();
			for (var k = 0; k < allyList.getCount(); k++) {
				var unit = allyList.getData(k);
				var list = unit.getTurnStateList();
				this._applyMultiply(Id, rate, unit, list);
			}
		}
	};

	// 残りターン倍率適用の内部処理
	Fnc_ChangeStateTurn._applyMultiply = function (Id, rate, unit, list) {
		var count = list.getCount();
		for (var i = 0; i < count; i++) {
			var turnstate = list.getData(i);
			var state = turnstate.getState();
			if (state.getId() === Id) {
				var currentTurn = turnstate.getTurn();
				var newTurn = Math.floor(currentTurn * rate);
				turnstate.setTurn(newTurn);
				root.log(unit.getName() + " の「" + state.getName() + "」残りターンを " + currentTurn + "→" + newTurn + " に変更しました。");
				break;
			}
		}
	};


})();
