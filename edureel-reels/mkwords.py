import json, sys
def words(n, fix, times={}, breaks_after=()):
    ws=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), f'pr_{n}.json'))); out=[]
    for i,(w,s,e) in enumerate(ws):
        s=times.get(i,s); w=fix.get(i,w)
        out.append(f'{w}@{s:.2f}')
        if i in breaks_after: out.append('|')
    return ' '.join(out)
if __name__=='__main__':
    ws=json.load(open(f'pr_{sys.argv[1]}.json')); print(' '.join(f'{i}:{w[0]}' for i,w in enumerate(ws)))
