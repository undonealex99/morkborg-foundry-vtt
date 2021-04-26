# Useful Macros

## Test Ability

```
if (actor !== null) {
  actor.testStrength();
}
```

There are equivalent functions for testAgility(), testPresence(), and testToughness().


## Defend

```
if (actor !== null) {
  actor.defend();
}
```


## Herbmaster Decoctions

```
(async () => {
let pack = game.packs.get('morkborg.rolls-occult-herbmaster');
let content = await pack.getContent();
let table = content.find(i => i.name === 'Occult Herbmaster Decoctions');
await table.draw();
new Roll('1d4').toMessage({ flavor: 'Doses Brewed' });
})();
```