import ccxt
import traceback
from backend.routes.auth import decrypt_secret

class NativeExecutionService:
    @staticmethod
    def execute_trade(exchange_name, api_key, encrypted_secret, ticker, direction, trade_size_usd):
        """
        Executes a market order on the specified exchange.
        ticker: 'BTC-USD'
        direction: 'LONG' or 'SHORT'
        trade_size_usd: float amount in USD
        """
        try:
            if not exchange_name or not api_key or not encrypted_secret:
                print(f"[Execution] Missing exchange credentials for {ticker}")
                return False
                
            api_secret = decrypt_secret(encrypted_secret)
            if not api_secret:
                print(f"[Execution] Failed to decrypt API secret for {ticker}")
                return False
                
            exchange_class = getattr(ccxt, exchange_name.lower(), None)
            if not exchange_class:
                print(f"[Execution] Unsupported exchange: {exchange_name}")
                return False
                
            exchange = exchange_class({
                'apiKey': api_key,
                'secret': api_secret,
                'enableRateLimit': True,
                'options': {'defaultType': 'spot'} # Safety: force spot market MVP
            })
            
            # Map ticker formats (e.g. BTC-USD -> BTC/USDT)
            symbol = ticker.replace('-', '/')
            if 'USD' in symbol and 'USDT' not in symbol:
                symbol = symbol.replace('USD', 'USDT')
                
            ticker_data = exchange.fetch_ticker(symbol)
            current_price = ticker_data['last']
            
            if not current_price or current_price <= 0:
                print(f"[Execution] Failed to fetch price for {symbol}")
                return False
                
            # Calculate amount to buy/sell
            amount = trade_size_usd / current_price
            
            # Adhere to exchange precision limits
            exchange.load_markets()
            if symbol not in exchange.markets:
                print(f"[Execution] Symbol {symbol} not available on {exchange_name}")
                return False
                
            amount = float(exchange.amount_to_precision(symbol, amount))
            
            side = 'buy' if direction.lower() == 'long' else 'sell'
            
            print(f"[Execution] Placing {side.upper()} order for {amount} {symbol} on {exchange_name} (Est. ${trade_size_usd})")
            
            order = exchange.create_market_order(symbol, side, amount)
            print(f"[Execution] Success! Order ID: {order['id']}")
            return True
            
        except Exception as e:
            print(f"[Execution] Error executing trade: {e}")
            traceback.print_exc()
            return False
