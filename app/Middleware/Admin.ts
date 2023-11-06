import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verify } from 'jsonwebtoken';
import Env from '@ioc:Adonis/Core/Env';
import axios from 'axios';

export default class Admin {
  public async handle({request, response}: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    try {
      const authorizationHeader = request.header('Authorization');

      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return response.status(401).json({ error: 'Invalid Authorization header' });
      }

      const jwt = authorizationHeader.replace('Bearer ', '');
      const decoded = verify(jwt, Env.get('JWT_SECRET'));

      const appId = Env.get('APP_ID');
      const urlAkses = Env.get('URL_PORTAL')+`akses/mine/${appId}`;

      const getAkses = await axios.get(urlAkses, {
        headers: {
          'Authorization': authorizationHeader,
        },
      });

      if (!getAkses.data || getAkses.data.level_akses < 9) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      if (Math.floor(Date.now() / 1000) >= decoded.exp) {
        return response.status(401).json({ error: 'Token has expired' });
      }

      request['userToken'] = authorizationHeader;
      request['decoded'] = decoded;

      await next();
    } catch (error) {
      console.error(error);
      return response.status(401).json({ error, message: 'Invalid or expired token' });
    }
  }
}
