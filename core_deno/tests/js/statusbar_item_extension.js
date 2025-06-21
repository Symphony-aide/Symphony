const item = await Symphony.crateStatusbarItem("test");
item.onClick(async () => {
    await item.hide();
})
await item.show();
