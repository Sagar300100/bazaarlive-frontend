
import React from 'react';
import { faqData } from '../constants/faqData';

interface FaqArticlePageProps {
    categoryKey: string | null;
    articleKey: string | null;
    onNavigate: (page: string, data?: any) => void;
}

const FaqArticlePage: React.FC<FaqArticlePageProps> = ({ categoryKey, articleKey, onNavigate }) => {
    if (!categoryKey || !(categoryKey in faqData) || !articleKey) {
        return <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center"><p>Article not found.</p></div>;
    }

    const category = faqData[categoryKey as keyof typeof faqData];
    const article = category.sections.flatMap(s => s.articles).find(a => a.slug === articleKey);

    if (!article) {
        return <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center"><p>Article not found.</p></div>;
    }

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen">
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="text-sm font-medium" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex items-center">
                             <li className="flex items-center">
                                <button onClick={() => onNavigate('help-center')} className="text-gray-400 hover:text-white">Whatnot Help Center</button>
                            </li>
                             <li className="flex items-center">
                                 <svg className="fill-current w-3 h-3 mx-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7 1L5.6 2.5L13 10l-7.4 7.5L7 19l9-9z"/></svg>
                                <button onClick={() => onNavigate('help-category', { category: categoryKey })} className="text-gray-400 hover:text-white">{category.title}</button>
                            </li>
                        </ol>
                    </nav>
                </div>
            </header>
            
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-gray-800 p-8 sm:p-10 rounded-lg">
                    <article className="prose prose-invert prose-lg max-w-none prose-p:text-gray-300 prose-headings:text-white prose-a:text-orange-400 hover:prose-a:text-orange-300 prose-ul:list-disc prose-ul:ml-5 prose-li:my-1">
                        <h1>{article.title}</h1>
                        <div dangerouslySetInnerHTML={{ __html: article.content }} />
                    </article>
                </div>
            </main>
        </div>
    );
};

export default FaqArticlePage;
