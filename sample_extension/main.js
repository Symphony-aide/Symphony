const item = await Symphony.crateStatusbarItem("Click me!");

await item.show();

item.onClick(() => {
    item.setLabel(Math.random().toString())
})

Symphony.whenUnload().then(() => Symphony.exit())