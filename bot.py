import discord
from discord.ext import commands
from discord.ui import Button, View
import json
import os

# ---- Carregar configurações ----
try:
    with open("config.json", "r", encoding="utf-8") as f:
        config = json.load(f)
except FileNotFoundError:
    print("❌ Arquivo config.json não encontrado!")
    exit(1)

# Pegar token das variáveis de ambiente (mais seguro)
TOKEN = os.getenv("DISCORD_TOKEN") or config.get("token")
if not TOKEN or TOKEN == "SEU_TOKEN_AQUI":
    print("❌ Token do Discord não configurado!")
    print("Configure a variável de ambiente DISCORD_TOKEN ou edite o config.json")
    exit(1)

TAXA_FIXA = config["taxa"]
VALORES = config["valores"]
CANAIS_FILAS = config["canais"]

# ---- Setup do bot ----
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Fila de jogadores e adms
filas = {modo: {valor: [] for valor in VALORES} for modo in CANAIS_FILAS.keys()}
fila_adms = []


# ---- Criar botões de aposta ----
def criar_botoes(tipo, valor):
    view = View(timeout=None)  # Botões permanentes

    btn_entrar = Button(label="🎮 Entrar", style=discord.ButtonStyle.green)
    btn_sair = Button(label="❌ Sair", style=discord.ButtonStyle.red)

    async def entrar_callback(interaction):
        user_id = interaction.user.id
        
        if user_id not in filas[tipo][valor]:
            filas[tipo][valor].append(user_id)
            await interaction.response.send_message(
                f"✅ {interaction.user.mention} entrou na fila **{tipo}** R${valor},00",
                ephemeral=True
            )

            # Checa se já tem 2 jogadores
            if len(filas[tipo][valor]) == 2:
                if not fila_adms:
                    await interaction.followup.send("⚠️ Nenhum ADM disponível!", ephemeral=True)
                    return

                jogador1, jogador2 = filas[tipo][valor]
                adm = fila_adms.pop(0)
                fila_adms.append(adm)  # rodízio de adms

                valor_total = valor + TAXA_FIXA
                premio = valor * 2

                embed = discord.Embed(
                    title="🎮 PARTIDA FORMADA!",
                    description=(
                        f"**Modo:** {tipo.upper()}\n"
                        f"**Jogadores:** <@{jogador1}> vs <@{jogador2}>\n"
                        f"**Valor da aposta:** R${valor},00\n"
                        f"**Cada jogador paga:** R${valor_total:.2f}\n"
                        f"**Vencedor recebe:** R${premio:.2f}\n"
                        f"**ADM responsável:** <@{adm}>"
                    ),
                    color=discord.Color.green()
                )
                
                await interaction.channel.send(embed=embed)
                filas[tipo][valor] = []

        else:
            await interaction.response.send_message("⚠️ Você já está nessa fila!", ephemeral=True)

    async def sair_callback(interaction):
        user_id = interaction.user.id
        
        if user_id in filas[tipo][valor]:
            filas[tipo][valor].remove(user_id)
            await interaction.response.send_message(
                f"❌ {interaction.user.mention} saiu da fila {tipo} R${valor},00",
                ephemeral=True
            )
        else:
            await interaction.response.send_message("⚠️ Você não está nessa fila!", ephemeral=True)

    btn_entrar.callback = entrar_callback
    btn_sair.callback = sair_callback
    view.add_item(btn_entrar)
    view.add_item(btn_sair)
    return view


# ---- Comandos ----
@bot.command(name="criarfilas")
@commands.has_permissions(administrator=True)
async def criarfilas(ctx):
    """Cria todas as filas de apostas nos canais configurados"""
    filas_criadas = 0
    
    for tipo, canal_id in CANAIS_FILAS.items():
        canal = bot.get_channel(canal_id)
        if canal and isinstance(canal, (discord.TextChannel, discord.DMChannel, discord.GroupChannel, discord.Thread)):
            for valor in VALORES:
                embed = discord.Embed(
                    title=f"🎮 Fila {tipo.upper()} - R${valor},00",
                    description=(
                        f"💰 **Valor:** R${valor},00\n"
                        f"📌 **Cada jogador paga:** R${valor + TAXA_FIXA:.2f}\n"
                        f"🏆 **Vencedor recebe:** R${valor * 2:.2f}\n\n"
                        f"👉 Use os botões abaixo para entrar ou sair da fila."
                    ),
                    color=discord.Color.blue()
                )
                await canal.send(embed=embed, view=criar_botoes(tipo, valor))
                filas_criadas += 1
        else:
            await ctx.send(f"⚠️ Canal para {tipo} não encontrado ou não é um canal de texto (ID: {canal_id})")
    
    await ctx.send(f"✅ {filas_criadas} filas foram criadas!")


@bot.command(name="entraradm")
async def entraradm(ctx):
    """Adiciona o usuário à fila de ADMs"""
    user_id = ctx.author.id
    
    if user_id not in fila_adms:
        fila_adms.append(user_id)
        await ctx.send(f"✅ {ctx.author.mention} entrou na fila de ADMs!")
    else:
        await ctx.send("⚠️ Você já está na fila de ADMs!")


@bot.command(name="sairadm")
async def sairadm(ctx):
    """Remove o usuário da fila de ADMs"""
    user_id = ctx.author.id
    
    if user_id in fila_adms:
        fila_adms.remove(user_id)
        await ctx.send(f"❌ {ctx.author.mention} saiu da fila de ADMs!")
    else:
        await ctx.send("⚠️ Você não está na fila de ADMs!")


@bot.command(name="filaadm")
async def filaadm(ctx):
    """Mostra a fila atual de ADMs"""
    if not fila_adms:
        await ctx.send("⚠️ Nenhum ADM na fila!")
        return
    
    embed = discord.Embed(
        title="👑 Fila de ADMs",
        description=" → ".join([f"<@{uid}>" for uid in fila_adms]),
        color=discord.Color.gold()
    )
    await ctx.send(embed=embed)


@bot.command(name="status")
async def status(ctx):
    """Mostra o status de todas as filas"""
    embed = discord.Embed(title="📊 Status das Filas", color=discord.Color.blue())
    
    for tipo in CANAIS_FILAS.keys():
        fila_info = []
        for valor in VALORES:
            count = len(filas[tipo][valor])
            if count > 0:
                users = [f"<@{uid}>" for uid in filas[tipo][valor]]
                fila_info.append(f"R${valor}: {count}/2 - {', '.join(users)}")
        
        if fila_info:
            embed.add_field(
                name=f"🎮 {tipo.upper()}",
                value="\n".join(fila_info),
                inline=False
            )
        else:
            embed.add_field(
                name=f"🎮 {tipo.upper()}",
                value="Todas as filas vazias",
                inline=False
            )
    
    embed.add_field(
        name="👑 ADMs",
        value=f"{len(fila_adms)} ADMs na fila",
        inline=False
    )
    
    await ctx.send(embed=embed)


@bot.command(name="limpar")
@commands.has_permissions(administrator=True)
async def limpar(ctx, tipo=None, valor=None):
    """Limpa filas específicas ou todas as filas"""
    if tipo and valor:
        if tipo in filas and valor in VALORES:
            filas[tipo][valor] = []
            await ctx.send(f"✅ Fila {tipo} R${valor} limpa!")
        else:
            await ctx.send("⚠️ Tipo ou valor inválido!")
    elif tipo:
        if tipo in filas:
            for v in VALORES:
                filas[tipo][v] = []
            await ctx.send(f"✅ Todas as filas de {tipo} limpas!")
        else:
            await ctx.send("⚠️ Tipo inválido!")
    else:
        for t in filas:
            for v in VALORES:
                filas[t][v] = []
        await ctx.send("✅ Todas as filas limpas!")


# ---- Eventos ----
@bot.event
async def on_ready():
    print(f"✅ Bot conectado como {bot.user}")
    print(f"🎮 Servindo {len(bot.guilds)} servidor(es)")
    
    # Sincronizar comandos (se necessário)
    try:
        synced = await bot.tree.sync()
        print(f"🔄 {len(synced)} comandos sincronizados")
    except Exception as e:
        print(f"⚠️ Erro ao sincronizar comandos: {e}")


@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.send("⚠️ Você não tem permissão para usar este comando!")
    elif isinstance(error, commands.CommandNotFound):
        pass  # Ignora comandos não encontrados
    else:
        print(f"Erro: {error}")
        await ctx.send("⚠️ Ocorreu um erro ao executar o comando!")


# ---- Executar o bot ----
if __name__ == "__main__":
    try:
        bot.run(TOKEN)
    except discord.LoginFailure:
        print("❌ Token inválido! Verifique o token do Discord.")
    except Exception as e:
        print(f"❌ Erro ao iniciar o bot: {e}")