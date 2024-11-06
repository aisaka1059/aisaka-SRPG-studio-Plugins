/*--------------------------------------------------------------------------
概要：
・このスキルを所持している場合、カスタムパラメータに記載した以上のダメージを受けなくなります

使用方法：
・カスタムスキルのキーワードに damage_cap と入れて、スキルのカスタムパラメータに {damagecap:20,Auto:true} のように書いてください
・以上のような書き方だと、一度の戦闘で受けるダメージは20まで、戦闘終了後にダメージキャップはリセットされます。
・Autoが書かれていない、例えば{damagecap:20}とした場合でも同じになります。
・Autoがfalseの場合、自動でリセットはされません。1戦闘ではなく、1ターンごとにリセットしたい場合等にお使いください。その場合リセットしたいタイミングで

var damagecap_customclear = {

        Memberlist: function () {
            var playerList = PlayerList.getAliveList();
            this.reset(playerList, playerList.getCount());

            var enemyList = EnemyList.getAliveList();
            this.reset(enemyList, enemyList.getCount());

            var allyList = AllyList.getAliveList();
            this.reset(allyList, allyList.getCount());

        },

        reset: function (unitList, unitCount) {
            var i;
            for (i = 0; i < unitCount; i++) {
                var unit = unitList.getData(i);
                unit.custom.damagcap = [];
            }
        }
    };

damagecap_customclear.Memberlist();

とスクリプトの実行→コード実行に書いてください。そのままコピー＆ペーストでOKです

・書かない場合永遠にリセットされません。お気を付けください

製作者：
藍坂
https://x.com/zwuQkSNgQ9B2zvy

動作確認バージョン：
v1.303

更新履歴：
2024/11/04　作成
2024/11/07　ゲームを最初から始めた時の最初の戦闘でダメージキャップスキルを持たないユニットに攻撃した場合のエラーを起こす不具合を修正

規約：
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・クレジット明記無し　OK (明記する場合は"藍坂"でお願いします)
・加工、再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

(function () {

    var damagecap_reset = defineObject(BaseFlowEntry,
        {
            _targetUnit: null,

            enterFlowEntry: function (playerTurn) {
                this._prepareMemberData(playerTurn);
                return this._completeMemberData(playerTurn);
            },

            moveFlowEntry: function () {
                damagecap_clear.Memberlist();
                return MoveResult.END;
            },

            _prepareMemberData: function (playerTurn) {
                this._targetUnit = playerTurn.getTurnTargetUnit();
            },

            _completeMemberData: function (playerTurn) {
                return EnterResult.OK;
            }

        });

    var damagecap_clear = {

        Memberlist: function () {
            var playerList = PlayerList.getAliveList();
            this.reset(playerList, playerList.getCount());

            var enemyList = EnemyList.getAliveList();
            this.reset(enemyList, enemyList.getCount());

            var allyList = AllyList.getAliveList();
            this.reset(allyList, allyList.getCount());

        },

        reset: function (unitList, unitCount) {
            var i;
            for (i = 0; i < unitCount; i++) {
                var unit = unitList.getData(i);
                if (unit.custom.damagcap !== 'undefined') {

                    var j;
                    var arr = SkillControl.getDirectSkillArray(unit, SkillType.CUSTOM, 'damage_cap');

                    count = arr.length;

                    for (j = 0; j < count; j++) {
                        skill = arr[j].skill;

                        if (skill.custom.Auto === true || skill.custom.Auto == null) {
                            unit.custom.damagcap = [];
                        }
                    }
                }
            }
        }
    };


    var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
    SkillRandomizer.isCustomSkillInvokedInternal = function (active, passive, skill, keyword) {
        if (keyword === 'damage_cap') {
            // 発動率を満たしているかを調べる
            return this._isSkillInvokedInternal(active, passive, skill);
        }

        // サポートできるスキルでない場合は、既定のメソッドを呼び出す。
        // これを忘れると、他の開発者のスキルが考慮される機会がなくなる。
        return alias1.call(this, active, passive, skill, keyword);
    };


    var alias2 = AttackEvaluator.HitCritical.calculateDamage;
    AttackEvaluator.HitCritical.calculateDamage = function (virtualActive, virtualPassive, attackEntry) {
        var damage = alias2.call(this, virtualActive, virtualPassive, attackEntry);

        if (SkillControl.checkAndPushCustomSkill(virtualPassive.unitSelf, virtualActive.unitSelf, attackEntry, true, 'damage_cap') !== null) {
            var i, count;

            var arr = SkillControl.getDirectSkillArray(virtualPassive.unitSelf, SkillType.CUSTOM, 'damage_cap');

            count = arr.length;

            for (i = 0; i < count; i++) {
                skill = arr[i].skill;
            }

            if (!virtualPassive.unitSelf.custom.damagcap || virtualPassive.unitSelf.custom.damagcap.length === 0) {
                virtualPassive.unitSelf.custom.damagcap = [];
                virtualPassive.unitSelf.custom.damagcap = skill.custom.damagecap;
            }

            if (damage > virtualPassive.unitSelf.custom.damagcap) {
                damage = virtualPassive.unitSelf.custom.damagcap;
                if (virtualPassive.unitSelf.custom.damagcap <= 0) {
                    damage = 0;
                    virtualPassive.unitSelf.custom.damagcap = 0;
                }
            }

            if (damage <= virtualPassive.unitSelf.custom.damagcap) {
                virtualPassive.unitSelf.custom.damagcap -= damage;
                if (virtualPassive.unitSelf.custom.damagcap <= 0) {
                    virtualPassive.unitSelf.custom.damagcap = -1;
                }
            }
        }

        return damage;
    };

    var alias3 = MapSequenceCommand._pushFlowEntries;
    MapSequenceCommand._pushFlowEntries = function (straightFlow) {
        alias3.call(this, straightFlow);
        straightFlow.pushFlowEntry(damagecap_reset);
    };
})();
