describe ('import vue components', () => {
    test('normal imports as expected', async () => {
        const cmp = await import('../app.vue')
        expect(cmp).toBeDefined()
    })
})