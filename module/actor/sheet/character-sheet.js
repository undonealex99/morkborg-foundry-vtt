import MBActorSheet from "./actor-sheet.js";
import RestDialog from "./rest-dialog.js";
import { trackAmmo, trackCarryingCapacity } from "../../settings.js";
import ScvmDialog from "../../scvm/scvm-dialog.js";
import { byName } from "../../utils.js";
import { rollBroken } from "../broken.js";
import { getBetter } from "../get-better.js";
import { useFeat } from "../feats.js";
import {
  testAgility,
  testPresence,
  testStrength,
  testToughness,
} from "../test-abilities.js";
import { rollOmens } from "../omens.js";
import { rollPowersPerDay, wieldPower } from "../powers.js";

/**
 * @extends {ActorSheet}
 */
export class MBCharacterSheet extends MBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["morkborg", "sheet", "actor", "character"],
      template: "systems/morkborg/templates/actor/character-sheet.hbs",
      width: 750,
      height: 690,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "violence",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  getData() {
    const superData = super.getData();
    superData.config = CONFIG.MB;
    const data = superData.data;

    // Ability Scores
    for (const [a, abl] of Object.entries(data.system.abilities)) {
      const translationKey = CONFIG.MB.abilities[a];
      abl.label = game.i18n.localize(translationKey);
    }

    this._prepareCharacterItems(data);
    data.system.trackCarryingCapacity = trackCarryingCapacity();
    data.system.trackAmmo = trackAmmo();
    return superData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} sheetData The sheet data to prepare.
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    sheetData.system.feats = sheetData.items
      .filter((item) => item.type === CONFIG.MB.itemTypes.feat)
      .sort(byName);

    sheetData.system.class = sheetData.items.find(
      (item) => item.type === CONFIG.MB.itemTypes.class
    );

    sheetData.system.scrolls = sheetData.items
      .filter((item) => item.type === CONFIG.MB.itemTypes.scroll)
      .sort(byName);

    sheetData.system.equipment = sheetData.items
      .filter((item) => CONFIG.MB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !item.system.hasContainer)
      .sort(byName);

    sheetData.system.equippedArmor = sheetData.items
      .filter((item) => item.type === CONFIG.MB.itemTypes.armor)
      .find((item) => item.system.equipped);

    sheetData.system.equippedShield = sheetData.items
      .filter((item) => item.type === CONFIG.MB.itemTypes.shield)
      .find((item) => item.system.equipped);

    sheetData.system.equippedWeapons = sheetData.items
      .filter((item) => item.type === CONFIG.MB.itemTypes.weapon)
      .filter((item) => item.system.equipped)
      .sort(byName);

    sheetData.system.ammo = sheetData.items
      .filter((item) => item.type === CONFIG.MB.itemTypes.ammo)
      .sort(byName);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // sheet header
    html
      .find(".ability-label.rollable.strength")
      .on("click", this._onStrengthRoll.bind(this));
    html
      .find(".ability-label.rollable.agility")
      .on("click", this._onAgilityRoll.bind(this));
    html
      .find(".ability-label.rollable.presence")
      .on("click", this._onPresenceRoll.bind(this));
    html
      .find(".ability-label.rollable.toughness")
      .on("click", this._onToughnessRoll.bind(this));
    html.find(".item-scvmify").click(this._onScvmify.bind(this));
    html.find(".broken-button").on("click", this._onBroken.bind(this));
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html
      .find(".omens-row span.rollable")
      .on("click", this._onOmensRoll.bind(this));
    html.find(".get-better-button").on("click", this._onGetBetter.bind(this));
    // feats tab
    html.find(".feat-button").on("click", this._onFeatRoll.bind(this));
    // powers tab
    html
      .find(".wield-power-button")
      .on("click", this._onWieldPowerRoll.bind(this));
    html
      .find(".powers-per-day-text")
      .on("click", this._onPowersPerDayRoll.bind(this));
  }

  _onStrengthRoll(event) {
    event.preventDefault();
    testStrength(this.actor);
  }

  _onAgilityRoll(event) {
    event.preventDefault();
    testAgility(this.actor);
  }

  _onPresenceRoll(event) {
    event.preventDefault();
    testPresence(this.actor);
  }

  _onToughnessRoll(event) {
    event.preventDefault();
    testToughness(this.actor);
  }

  _onOmensRoll(event) {
    event.preventDefault();
    rollOmens(this.actor);
  }

  _onPowersPerDayRoll(event) {
    event.preventDefault();
    rollPowersPerDay(this.actor);
  }

  _onScvmify(event) {
    event.preventDefault();
    new ScvmDialog(this.actor).render(true);
  }

  _onBroken(event) {
    event.preventDefault();
    rollBroken(this.actor);
  }

  _onRest(event) {
    event.preventDefault();
    const restDialog = new RestDialog();
    // TODO: maybe move this into a constructor,
    // if we can resolve the mergeObject() Maximum call stack size exceeded error
    restDialog.actor = this.actor;
    restDialog.render(true);
  }

  _onGetBetter(event) {
    event.preventDefault();
    // confirm before doing get better
    const d = new Dialog({
      title: game.i18n.localize("MB.GetBetter"),
      content:
        "<p>&nbsp;<p>The game master decides when a character should be improved.<p>It can be after completing a scenario, killing mighty foes, or bringing home treasure.<p>&nbsp;",
      buttons: {
        cancel: {
          label: game.i18n.localize("MB.Cancel"),
        },
        getbetter: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("MB.GetBetter"),
          callback: () => getBetter(this.actor),
        },
      },
      default: "cancel",
    });
    d.render(true);
  }

  _onFeatRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("itemId");
    useFeat(this.actor, itemId);
  }

  _onWieldPowerRoll(event) {
    event.preventDefault();
    wieldPower(this.actor);
  }
}
